import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * Pagamento da fatura de assinatura do vendedor.
 *
 * A fatura só pode ser marcada como paga aqui (service role), depois que o
 * Pagar.me confirma a cobrança. O vendedor não tem permissão de UPDATE em
 * seller_invoices — por isso o pagamento não pode ser simulado no navegador.
 *
 * Contrato:
 *   { action: "pay_card", invoiceId, cardToken, installments? }
 *   { action: "create_pix", invoiceId }
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

const sanitizeDigits = (value: unknown) => String(value || '').replace(/\D/g, '')

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405)

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // ── Autenticação ─────────────────────────────────────────────────────
    const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '').trim()
    if (!token) return json({ error: 'unauthorized', message: 'Token ausente.' }, 401)

    const { data: authData, error: authError } = await supabase.auth.getUser(token)
    const user = authData?.user
    if (authError || !user) {
      return json({ error: 'unauthorized', message: 'Sessão inválida.' }, 401)
    }

    const body = await req.json().catch(() => ({}))
    const action = body?.action
    const invoiceId = body?.invoiceId

    // ── Troca de plano / cancelamento ────────────────────────────────────
    // O vendedor não tem UPDATE em seller_subscriptions/seller_invoices.
    if (action === 'change_plan') {
      const planId = body?.planId
      if (!planId) return json({ error: 'missing_plan', message: 'planId é obrigatório.' }, 400)

      const { data: plan, error: planError } = await supabase
        .from('subscription_plans')
        .select('id, name, price, is_active')
        .eq('id', planId)
        .maybeSingle()

      if (planError) throw planError
      if (!plan || plan.is_active === false) {
        return json({ error: 'plan_not_found', message: 'Plano indisponível.' }, 404)
      }

      const now = new Date()
      const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
      const dueDate = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)

      const { data: existing, error: existingError } = await supabase
        .from('seller_subscriptions')
        .select('id')
        .eq('seller_id', user.id)
        .maybeSingle()

      if (existingError) throw existingError

      let subscriptionId: string

      if (existing?.id) {
        const { data: updated, error: updateError } = await supabase
          .from('seller_subscriptions')
          .update({
            plan_id: plan.id,
            status: 'active',
            current_period_start: now.toISOString(),
            current_period_end: periodEnd.toISOString(),
          })
          .eq('id', existing.id)
          .select('id')
          .single()

        if (updateError) throw updateError
        subscriptionId = updated.id
      } else {
        const { data: created, error: createError } = await supabase
          .from('seller_subscriptions')
          .insert({
            seller_id: user.id,
            plan_id: plan.id,
            status: 'active',
            current_period_start: now.toISOString(),
            current_period_end: periodEnd.toISOString(),
          })
          .select('id')
          .single()

        if (createError) throw createError
        subscriptionId = created.id
      }

      const { data: invoice, error: invoiceCreateError } = await supabase
        .from('seller_invoices')
        .insert({
          seller_id: user.id,
          subscription_id: subscriptionId,
          amount: plan.price,
          status: 'pending',
          due_date: dueDate.toISOString(),
        })
        .select()
        .single()

      if (invoiceCreateError) throw invoiceCreateError

      return json({ success: true, subscription_id: subscriptionId, invoice })
    }

    if (action === 'cancel_subscription') {
      const { error: cancelError } = await supabase
        .from('seller_subscriptions')
        .update({ status: 'canceled' })
        .eq('seller_id', user.id)

      if (cancelError) throw cancelError
      return json({ success: true, status: 'canceled' })
    }

    if (!invoiceId) return json({ error: 'missing_invoice', message: 'invoiceId é obrigatório.' }, 400)
    if (action !== 'pay_card' && action !== 'create_pix') {
      return json({ error: 'invalid_action', message: 'Ação não suportada.' }, 400)
    }

    // ── Fatura do próprio vendedor ───────────────────────────────────────
    const { data: invoice, error: invoiceError } = await supabase
      .from('seller_invoices')
      .select('id, seller_id, subscription_id, amount, status, due_date')
      .eq('id', invoiceId)
      .maybeSingle()

    if (invoiceError) throw invoiceError
    if (!invoice) return json({ error: 'invoice_not_found', message: 'Fatura não encontrada.' }, 404)
    if (invoice.seller_id !== user.id) {
      return json({ error: 'forbidden', message: 'Esta fatura não pertence à sua conta.' }, 403)
    }
    if (invoice.status === 'paid') {
      return json({ error: 'already_paid', message: 'Esta fatura já está paga.' }, 409)
    }
    if (invoice.status === 'cancelled') {
      return json({ error: 'cancelled', message: 'Esta fatura está cancelada.' }, 409)
    }

    // ── Dados do cliente para o gateway ──────────────────────────────────
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, email, phone, postal_code, address, city, state')
      .eq('id', user.id)
      .maybeSingle()

    const { data: application } = await supabase
      .from('seller_applications')
      .select('full_name, company_name, cpf, cnpj, phone, postal_code, address, address_number, neighborhood, city, state, type')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const name =
      profile?.full_name ||
      application?.full_name ||
      application?.company_name ||
      user.email?.split('@')[0] ||
      'Vendedor TheAdoro'
    const email = user.email || ''
    const phone = sanitizeDigits(profile?.phone || application?.phone || '')
    const document = sanitizeDigits(application?.cpf || application?.cnpj || '')

    if (!email) {
      return json({ error: 'missing_email', message: 'Cadastre um e-mail antes de pagar.' }, 400)
    }
    if (!document || (document.length !== 11 && document.length !== 14)) {
      return json({
        error: 'missing_document',
        message: 'Cadastre um CPF/CNPJ válido antes de pagar a assinatura.',
      }, 400)
    }

    const documentType = document.length === 14 ? 'CNPJ' : 'CPF'
    const customerType = document.length === 14 ? 'company' : 'individual'

    const billingAddress = {
      line_1: [application?.address_number, application?.address, application?.neighborhood]
        .filter(Boolean)
        .join(', ') || profile?.address || 'Endereço não informado',
      line_2: '',
      zip_code: sanitizeDigits(application?.postal_code || profile?.postal_code || ''),
      city: application?.city || profile?.city || 'Cuiabá',
      state: application?.state || profile?.state || 'MT',
      country: 'BR',
    }

    // ── Credenciais Pagar.me (mesma origem da process-payment) ───────────
    const { data: settings, error: settingsError } = await supabase
      .from('site_settings')
      .select('key, value')
      .in('key', [
        'payment_pagarme_secret_key',
        'payment_pagarme_test_mode',
        'payment_pagarme_test_secret_key',
      ])

    if (settingsError) throw settingsError

    const getSetting = (key: string) => {
      const value = settings?.find((item: any) => item.key === key)?.value
      return typeof value === 'string' ? value.replace(/^"|"$/g, '') : value
    }

    const isTestMode = getSetting('payment_pagarme_test_mode') === true ||
      getSetting('payment_pagarme_test_mode') === 'true'
    const secretKey = isTestMode
      ? (getSetting('payment_pagarme_test_secret_key') || getSetting('payment_pagarme_secret_key'))
      : getSetting('payment_pagarme_secret_key')

    if (!secretKey) {
      return json({
        error: 'gateway_not_configured',
        message: 'Pagar.me não configurado. Informe a Secret Key no admin.',
      }, 503)
    }

    const amountInCents = Math.round(Number(invoice.amount) * 100)
    if (!Number.isFinite(amountInCents) || amountInCents <= 0) {
      return json({ error: 'invalid_amount', message: 'Fatura com valor inválido.' }, 422)
    }

    const isCard = action === 'pay_card'
    const cardToken = body?.cardToken

    if (isCard && !cardToken) {
      return json({ error: 'missing_card_token', message: 'Token do cartão ausente.' }, 400)
    }

    const merchantCode = `INV-${invoice.id}`
    const idempotencyKey = body?.idempotencyKey ||
      `invoice:${invoice.id}:${isCard ? 'card' : 'pix'}:${Date.now()}`

    const paymentPayload: any = isCard
      ? {
          payment_method: 'credit_card',
          credit_card: {
            operation_type: 'auth_and_capture',
            card_token: cardToken,
            installments: Math.max(1, Number(body?.installments) || 1),
            statement_descriptor: 'THEADORO',
            card: { billing_address: billingAddress },
          },
        }
      : {
          payment_method: 'pix',
          pix: { expires_in: 600 },
        }

    const gatewayResponse = await fetch('https://api.pagar.me/core/v5/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Basic ' + btoa(secretKey + ':'),
        'Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify({
        closed: true,
        code: merchantCode,
        items: [{
          amount: amountInCents,
          description: 'Assinatura TheAdoro',
          quantity: 1,
          code: `invoice_${invoice.id}`,
        }],
        customer: {
          name,
          email,
          type: customerType,
          document,
          document_type: documentType,
          phones: {
            home_phone: { country_code: '55', area_code: phone.slice(0, 2) || '65', number: phone.slice(2) || '000000000' },
            mobile_phone: { country_code: '55', area_code: phone.slice(0, 2) || '65', number: phone.slice(2) || '000000000' },
          },
          address: billingAddress,
        },
        payments: [paymentPayload],
      }),
    })

    const gatewayData = await gatewayResponse.json().catch(() => null)

    if (!gatewayResponse.ok) {
      const message =
        gatewayData?.message ||
        gatewayData?.errors?.[0]?.message ||
        'O gateway recusou a cobrança da assinatura.'
      return json({ error: 'gateway_error', message, gateway_response: gatewayData }, 402)
    }

    const charge = gatewayData?.charges?.[0]
    const chargeStatus = charge?.status
    const lastTransaction = charge?.last_transaction || {}

    if (isCard) {
      if (chargeStatus === 'paid') {
        const { error: updateError } = await supabase
          .from('seller_invoices')
          .update({
            status: 'paid',
            paid_at: new Date().toISOString(),
            payment_method: 'credit_card',
          })
          .eq('id', invoice.id)

        if (updateError) throw updateError

        return json({
          success: true,
          status: 'paid',
          invoiceId: invoice.id,
          provider_transaction_id: gatewayData?.id,
        })
      }

      if (chargeStatus === 'failed') {
        const message =
          lastTransaction?.gateway_response?.message ||
          lastTransaction?.gateway_response?.errors?.[0]?.message ||
          'Pagamento recusado. Verifique os dados do cartão.'
        return json({ error: 'payment_failed', message }, 402)
      }

      return json({
        success: true,
        status: 'pending',
        invoiceId: invoice.id,
        provider_transaction_id: gatewayData?.id,
        message: 'Pagamento em análise pelo gateway.',
      })
    }

    // ── PIX ──────────────────────────────────────────────────────────────
    const pixCode = lastTransaction?.qr_code || gatewayData?.pix?.qr_code || null
    const pixUrl = lastTransaction?.qr_code_url || gatewayData?.pix?.qr_code_url || null

    const { error: pixUpdateError } = await supabase
      .from('seller_invoices')
      .update({
        payment_method: 'pix',
        pix_code: pixCode,
        pix_qr_url: pixUrl,
      })
      .eq('id', invoice.id)

    if (pixUpdateError) throw pixUpdateError

    return json({
      success: true,
      status: 'pending',
      invoiceId: invoice.id,
      pix_code: pixCode,
      pix_url: pixUrl,
      pix_expiration: lastTransaction?.expires_at || null,
      provider_transaction_id: gatewayData?.id,
      is_test_mode: isTestMode,
    })
  } catch (error) {
    console.error('seller-invoice-payment error:', error)
    return json({ error: 'internal_error', message: (error as Error).message }, 500)
  }
})
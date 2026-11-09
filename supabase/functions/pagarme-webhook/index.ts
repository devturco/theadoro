import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * Webhook do Pagar.me — confirmação de pagamento (PIX, boleto, cartão).
 *
 * Função:
 *   1. autentica a chamada (Basic Auth na URL do webhook OU header secreto)
 *   2. encontra o pedido pelo id da transação / código do pedido
 *   3. atualiza payments + orders
 *   4. quando a entrega é Uber e ainda não foi despachada, solicita a corrida
 *
 * Autenticação (configure ao menos uma):
 *   PAGARME_WEBHOOK_USER + PAGARME_WEBHOOK_PASSWORD  → Basic Auth na URL
 *   PAGARME_WEBHOOK_SECRET                           → header x-webhook-secret
 *
 * URL a cadastrar no Pagar.me:
 *   https://<projeto>.supabase.co/functions/v1/pagarme-webhook
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-secret',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let mismatch = 0
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return mismatch === 0
}

function authorize(req: Request): { ok: boolean; reason?: string } {
  const user = Deno.env.get('PAGARME_WEBHOOK_USER')
  const password = Deno.env.get('PAGARME_WEBHOOK_PASSWORD')
  const secret = Deno.env.get('PAGARME_WEBHOOK_SECRET')

  if (!user && !password && !secret) {
    return {
      ok: false,
      reason: 'Webhook sem autenticação configurada: defina PAGARME_WEBHOOK_USER + PAGARME_WEBHOOK_PASSWORD, ou PAGARME_WEBHOOK_SECRET.',
    }
  }

  if (secret) {
    const header = req.headers.get('x-webhook-secret') || ''
    if (header && constantTimeEqual(header, secret)) return { ok: true }
  }

  if (user && password) {
    const header = req.headers.get('authorization') || ''
    if (header.toLowerCase().startsWith('basic ')) {
      try {
        const decoded = atob(header.slice(6).trim())
        const separator = decoded.indexOf(':')
        if (separator > -1) {
          const gotUser = decoded.slice(0, separator)
          const gotPassword = decoded.slice(separator + 1)
          if (constantTimeEqual(gotUser, user) && constantTimeEqual(gotPassword, password)) {
            return { ok: true }
          }
        }
      } catch {
        // base64 inválido — cai no retorno de não autorizado
      }
    }
  }

  return { ok: false, reason: 'Credenciais do webhook inválidas.' }
}

const PAID_EVENTS = new Set(['charge.paid', 'order.paid'])
const FAILED_EVENTS = new Set(['charge.payment_failed', 'order.payment_failed', 'charge.failed', 'order.failed'])

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405)

  try {
    const auth = authorize(req)
    if (!auth.ok) {
      return json({ error: 'unauthorized', message: auth.reason }, 401)
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const event = await req.json().catch(() => null)
    if (!event || typeof event !== 'object') {
      return json({ error: 'invalid_payload', message: 'Corpo inválido.' }, 400)
    }

    const type: string = event.type || ''
    const data: any = event.data || {}
    const eventId: string = event.id || ''

    const transactionId: string =
      data?.order?.id || data?.id || data?.transaction_id || data?.order_id || ''
    const orderCode: string =
      data?.code || data?.order?.code || data?.metadata?.merchant_order_code || ''

    if (!transactionId && !orderCode) {
      return json({ error: 'cannot_identify_order', message: 'Evento sem id de transação nem código de pedido.' }, 422)
    }

    // ── Fatura de assinatura do vendedor (código INV-<uuid>) ─────────────
    // Faturas não passam por `orders`/`payments`; são confirmadas direto em
    // seller_invoices.
    if (orderCode.startsWith('INV-')) {
      return await handleInvoiceEvent({
        supabase,
        invoiceId: orderCode.slice(4),
        type,
        eventId,
        data,
      })
    }

    // ── Localiza o pagamento ──────────────────────────────────────────────
    let payment: any = null

    if (transactionId) {
      const { data: byTransaction } = await supabase
        .from('payments')
        .select('id, order_id, status, metadata')
        .eq('provider_transaction_id', transactionId)
        .maybeSingle()
      payment = byTransaction
    }

    if (!payment && orderCode) {
      const { data: allPayments } = await supabase
        .from('payments')
        .select('id, order_id, status, metadata')
        .order('created_at', { ascending: false })
        .limit(200)
      payment = (allPayments || []).find((row: any) => {
        const meta = row.metadata || {}
        return meta.merchant_order_code === orderCode || meta?.gatewayResponse?.code === orderCode
      }) || null
    }

    if (!payment) {
      return json({
        error: 'payment_not_found',
        message: 'Pagamento não encontrado para este evento.',
        transactionId,
        orderCode,
      }, 404)
    }

    const isPaid = PAID_EVENTS.has(type)
    const isFailed = FAILED_EVENTS.has(type)

    // ── Idempotência ──────────────────────────────────────────────────────
    // O Pagar.me reenvia eventos. Se o pagamento já está aprovado, não
    // reprocessa a transição — mas ainda garante o despacho da entrega.
    if (isPaid && payment.status === 'approved') {
      await maybeDispatchUber(supabase, payment.order_id)
      return json({ ok: true, duplicated: true, orderId: payment.order_id, dispatch: 'checked' })
    }

    if (isPaid) {
      await supabase.from('payments').update({ status: 'approved' }).eq('id', payment.id)
      await supabase.from('orders').update({ status: 'processing' }).eq('id', payment.order_id)
    } else if (isFailed) {
      await supabase.from('payments').update({ status: 'failed' }).eq('id', payment.id)
    }

    // Registra o evento para auditoria (sem bloquear se a tabela recusar).
    try {
      await supabase.from('payment_events').insert({
        payment_id: payment.id,
        order_id: payment.order_id,
        provider: 'pagarme',
        event_type: type || 'unknown',
        payload: { eventId, type, data },
        processed_at: new Date().toISOString(),
      } as any)
    } catch (eventError) {
      console.error('payment_events insert failed:', eventError)
    }

    let dispatch: string = 'skipped'
    if (isPaid) {
      dispatch = await maybeDispatchUber(supabase, payment.order_id)
    }

    return json({ ok: true, processed: true, type, orderId: payment.order_id, dispatch })
  } catch (error) {
    console.error('pagarme-webhook error:', error)
    return json({ error: 'internal_error', message: (error as Error).message }, 500)
  }
})

/**
 * Confirma o pagamento de uma fatura de assinatura de vendedor.
 */
async function handleInvoiceEvent({
  supabase,
  invoiceId,
  type,
  eventId,
  data,
}: {
  supabase: ReturnType<typeof createClient>
  invoiceId: string
  type: string
  eventId: string
  data: any
}): Promise<Response> {
  const { data: invoice, error } = await supabase
    .from('seller_invoices')
    .select('id, seller_id, status, amount')
    .eq('id', invoiceId)
    .maybeSingle()

  if (error) throw error
  if (!invoice) {
    return json({ error: 'invoice_not_found', message: 'Fatura não encontrada.' }, 404)
  }

  const isPaid = PAID_EVENTS.has(type)
  const isFailed = FAILED_EVENTS.has(type)
  const alreadyPaid = (invoice as any).status === 'paid'

  if (isPaid && !alreadyPaid) {
    await supabase
      .from('seller_invoices')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
        payment_method: data?.payment_method || 'credit_card',
      })
      .eq('id', (invoice as any).id)
  }

  try {
    await supabase.from('payment_events').insert({
      provider: 'pagarme',
      event_type: type || 'unknown',
      payload: { eventId, type, data, invoiceId },
      processed_at: new Date().toISOString(),
    } as any)
  } catch (eventError) {
    console.error('invoice payment_events insert failed:', eventError)
  }

  return json({
    ok: true,
    processed: true,
    invoiceId: (invoice as any).id,
    status: isPaid ? 'paid' : (invoice as any).status,
    duplicated: isPaid && alreadyPaid,
    failed: isFailed,
  })
}

/**
 * Solicita a entrega na Uber quando o pedido usa Uber e ainda não foi
 * despachado. Reaproveita a function uber-delivery (idempotente por
 * uber_delivery_id), então chamar duas vezes não cria duas corridas.
 */
async function maybeDispatchUber(
  supabase: ReturnType<typeof createClient>,
  orderId: string
): Promise<string> {
  try {
    const { data: order } = await supabase
      .from('orders')
      .select('id, shipping_provider, shipping_quote_id, uber_delivery_id')
      .eq('id', orderId)
      .maybeSingle()

    if (!order) return 'order_not_found'
    if ((order as any).shipping_provider !== 'uber') return 'not_uber'
    if ((order as any).uber_delivery_id) return 'already_dispatched'
    if (!(order as any).shipping_quote_id) return 'missing_quote'

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    const response = await fetch(`${supabaseUrl}/functions/v1/uber-delivery`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'request', orderId }),
    })

    const result = await response.json().catch(() => ({}))
    if (!response.ok || result?.error) {
      console.error('uber dispatch failed from webhook:', result)
      return `dispatch_failed: ${result?.message || response.status}`
    }

    console.log('uber dispatch ok:', result?.delivery_id, result?.tracking_url)
    return 'dispatched'
  } catch (error) {
    console.error('maybeDispatchUber error:', error)
    return 'dispatch_error'
  }
}
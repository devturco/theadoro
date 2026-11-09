import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * Uber Direct — cotação e despacho.
 *
 * Ações:
 *   { action: 'quote',   origin, destination, items }
 *   { action: 'request', orderId, quote_id?, dropoff_phone? }
 *
 * O client_secret nunca chega ao browser: OAuth e chamadas acontecem aqui.
 *
 * Credenciais, em ordem de precedência:
 *   1. Secrets da function: UBER_CLIENT_ID, UBER_CLIENT_SECRET, UBER_CUSTOMER_ID
 *   2. site_settings: shipping_uber_client_id / _client_secret / _customer_id
 *
 * Referência: https://developer.uber.com/docs/deliveries/get-started
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const UBER_API = 'https://api.uber.com'
const UBER_TOKEN_URL = 'https://auth.uber.com/oauth/v2/token'
const UBER_SCOPE = 'eats.deliveries'

interface AddressInput {
  street?: string
  number?: string
  neighborhood?: string
  city?: string
  state?: string
  zip?: string
}

interface QuoteItem {
  name?: string
  quantity?: number
  weight?: number
}

let cachedToken: { value: string; expiresAt: number } | null = null

const onlyDigits = (value: string | undefined) => (value || '').replace(/\D/g, '')

const formatCep = (zip: string | undefined) => {
  const digits = onlyDigits(zip)
  return digits.length === 8 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : (zip || '')
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

async function getSetting(supabase: ReturnType<typeof createClient>, key: string): Promise<string | null> {
  const { data } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', key)
    .maybeSingle()
  if (!data) return null
  const raw = (data as { value: unknown }).value
  if (typeof raw === 'string') return raw.replace(/^"|"$/g, '')
  return raw == null ? null : String(raw)
}

async function getCredentials(supabase: ReturnType<typeof createClient>) {
  const clientId = Deno.env.get('UBER_CLIENT_ID') ?? (await getSetting(supabase, 'shipping_uber_client_id'))
  const clientSecret = Deno.env.get('UBER_CLIENT_SECRET') ?? (await getSetting(supabase, 'shipping_uber_client_secret'))
  const customerId = Deno.env.get('UBER_CUSTOMER_ID') ?? (await getSetting(supabase, 'shipping_uber_customer_id'))
  return { clientId, clientSecret, customerId }
}

async function getAccessToken(clientId: string, clientSecret: string): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.value

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'client_credentials',
    scope: UBER_SCOPE,
  })

  const response = await fetch(UBER_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })

  const payload = await response.json().catch(() => ({}))
  if (!response.ok || !payload?.access_token) {
    throw new Error(`Falha ao autenticar na Uber (${response.status}): ${JSON.stringify(payload)}`)
  }

  cachedToken = {
    value: payload.access_token,
    expiresAt: Date.now() + (Number(payload.expires_in) || 3600) * 1000,
  }
  return cachedToken.value
}

async function viaCep(zip: string): Promise<Partial<AddressInput>> {
  const digits = onlyDigits(zip)
  if (digits.length !== 8) return {}
  try {
    const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`)
    if (!response.ok) return {}
    const data = await response.json()
    if (data?.erro) return {}
    return {
      street: data.logradouro || undefined,
      neighborhood: data.bairro || undefined,
      city: data.localidade || undefined,
      state: data.uf || undefined,
      zip: digits,
    }
  } catch {
    return {}
  }
}

async function resolveAddress(input: AddressInput): Promise<AddressInput> {
  if (input.street && input.city && input.state) return input
  const fromCep = await viaCep(input.zip || '')
  return {
    street: input.street || fromCep.street,
    number: input.number,
    neighborhood: input.neighborhood || fromCep.neighborhood,
    city: input.city || fromCep.city,
    state: input.state || fromCep.state,
    zip: input.zip || fromCep.zip,
  }
}

/** A Uber espera o endereço como uma string contendo JSON. */
function toUberAddress(address: AddressInput): string {
  const streetLine = [address.street, address.number].filter(Boolean).join(', ')
  const lines = [streetLine, address.neighborhood].filter(Boolean) as string[]
  return JSON.stringify({
    street_address: lines,
    city: address.city,
    state: address.state,
    zip_code: formatCep(address.zip),
    country: 'BR',
  })
}

function manifestFromItems(items: QuoteItem[]) {
  return (items || []).map((item) => ({
    name: item.name || 'Presente',
    quantity: item.quantity ?? 1,
    weight: item.weight ? Math.max(1, Math.round(item.weight * 1000)) : 500,
  }))
}

async function loadStoreAddress(supabase: ReturnType<typeof createClient>): Promise<AddressInput> {
  const [street, city, state, zip] = await Promise.all([
    getSetting(supabase, 'store_address'),
    getSetting(supabase, 'store_city'),
    getSetting(supabase, 'store_state'),
    getSetting(supabase, 'store_cep'),
  ])
  return { street: street || '', city: city || '', state: state || '', zip: zip || '' }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // O gateway aceita a anon key como JWT; sem esta checagem qualquer
    // visitante poderia disparar uma corrida real. Service role (webhook) passa.
    const callerToken = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '').trim()
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    // Aceita a service role tanto pelo valor exato do runtime quanto por um
    // JWT legado com role=service_role (o valor do runtime pode mudar).
    const isServiceRoleToken = (token: string): boolean => {
      if (!token) return false
      if (serviceRoleKey && token === serviceRoleKey) return true

      try {
        const payloadPart = token.split('.')[1]
        if (!payloadPart) return false
        const normalized = payloadPart.replace(/-/g, '+').replace(/_/g, '/')
        const payload = JSON.parse(atob(normalized))
        return payload?.role === 'service_role'
      } catch {
        return false
      }
    }

    if (!callerToken) {
      return json({ error: 'unauthorized', message: 'Token ausente.' }, 401)
    }

    if (!isServiceRoleToken(callerToken)) {
      const { data: callerData, error: callerError } = await supabase.auth.getUser(callerToken)
      if (callerError || !callerData?.user) {
        return json({ error: 'unauthorized', message: 'Sessão inválida.' }, 401)
      }
    }

    const body = await req.json()
    const action = body?.action || 'quote'

    const { clientId, clientSecret, customerId } = await getCredentials(supabase)
    if (!clientId || !clientSecret || !customerId) {
      return json({
        error: 'not_configured',
        message: 'Uber Direct sem credenciais: preencha Client ID, Client Secret e Customer ID em Configurações, ou configure os secrets UBER_CLIENT_ID/_CLIENT_SECRET/_CUSTOMER_ID.',
      }, 503)
    }

    const token = await getAccessToken(clientId, clientSecret)
    const customerPath = `${UBER_API}/v1/customers/${encodeURIComponent(customerId)}`

    // ─────────────────────────────── COTAÇÃO ───────────────────────────────
    if (action === 'quote') {
      const { origin, destination, items } = body as {
        origin?: AddressInput
        destination?: AddressInput
        items?: QuoteItem[]
      }

      if (!destination?.zip && !destination?.street) {
        return json({ error: 'destination_required', message: 'Informe o CEP ou o endereço de entrega.' }, 400)
      }

      const [pickup, dropoff] = await Promise.all([
        resolveAddress(origin || (await loadStoreAddress(supabase))),
        resolveAddress(destination),
      ])

      if (!pickup.street || !dropoff.street) {
        return json({
          error: 'address_unresolved',
          message: 'Não foi possível resolver o endereço de coleta ou entrega a partir do CEP.',
        }, 422)
      }

      const response = await fetch(`${customerPath}/delivery_quotes`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pickup_address: toUberAddress(pickup),
          dropoff_address: toUberAddress(dropoff),
          manifest_items: manifestFromItems(items || []),
        }),
      })

      const quote = await response.json().catch(() => ({}))
      if (!response.ok) {
        return json({
          error: 'uber_error',
          status: response.status,
          message: quote.message || quote.error || 'A Uber recusou a cotação.',
          details: quote,
        }, 502)
      }

      return json({
        quote_id: quote.id,
        fee: Number(quote.fee),
        currency: quote.currency || 'BRL',
        dropoff_eta: quote.dropoff_eta ?? null,
        duration: quote.duration ?? null,
        pickup_duration: quote.pickup_duration ?? null,
        expires: quote.expires ?? null,
      })
    }

    // ─────────────────────────────── DESPACHO ──────────────────────────────
    if (action === 'request') {
      const { orderId, quote_id, dropoff_phone } = body as {
        orderId?: string
        quote_id?: string
        dropoff_phone?: string
      }

      if (!orderId) return json({ error: 'order_required', message: 'Informe o orderId.' }, 400)

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('id, buyer_id, shipping_address, shipping_quote_id, uber_delivery_id, tracking_url')
        .eq('id', orderId)
        .maybeSingle()

      if (orderError) return json({ error: 'order_lookup_failed', message: orderError.message }, 500)
      if (!order) return json({ error: 'order_not_found', message: 'Pedido não encontrado.' }, 404)

      // Idempotência: um pedido não pode gerar duas corridas.
      if ((order as any).uber_delivery_id) {
        return json({
          delivery_id: (order as any).uber_delivery_id,
          tracking_url: (order as any).tracking_url,
          reused: true,
        })
      }

      const storedQuote = quote_id || (order as any).shipping_quote_id
      if (!storedQuote) {
        return json({
          error: 'quote_required',
          message: 'Pedido sem cotação Uber. Gere a cotação no checkout ou reenvie com quote_id.',
        }, 422)
      }

      const parsed = (() => {
        try { return JSON.parse((order as any).shipping_address || '{}') } catch { return {} }
      })()

      const dropoff: AddressInput = {
        street: parsed.street,
        number: parsed.number,
        neighborhood: parsed.neighborhood,
        city: parsed.city,
        state: parsed.state,
        zip: parsed.zipCode,
      }

      const pickup = await resolveAddress(await loadStoreAddress(supabase))
      const dropoffResolved = await resolveAddress(dropoff)

      if (!pickup.street || !dropoffResolved.street) {
        return json({ error: 'address_unresolved', message: 'Endereço de coleta ou entrega incompleto.' }, 422)
      }

      const { data: orderItems } = await supabase
        .from('order_items')
        .select('quantity, product_id, products(name)')
        .eq('order_id', orderId)

      const items: QuoteItem[] = (orderItems || []).map((row: any) => ({
        name: row.products?.name || 'Presente',
        quantity: row.quantity,
      }))

      // Telefone do destinatário: o informado > o do pedido > o do perfil do comprador.
      let recipientPhone = dropoff_phone || parsed.recipient_phone || parsed.phone || ''
      if (!recipientPhone && (order as any).buyer_id) {
        const { data: buyer } = await supabase
          .from('profiles')
          .select('phone, full_name')
          .eq('id', (order as any).buyer_id)
          .maybeSingle()
        recipientPhone = (buyer as any)?.phone || ''
        if (!parsed.recipient_name && (buyer as any)?.full_name) {
          parsed.recipient_name = (buyer as any).full_name
        }
      }

      const response = await fetch(`${customerPath}/deliveries`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quote_id: storedQuote,
          pickup_address: toUberAddress(pickup),
          pickup_name: 'THEADORO',
          pickup_phone_number: (await getSetting(supabase, 'store_phone')) || undefined,
          dropoff_address: toUberAddress(dropoffResolved),
          dropoff_name: parsed.recipient_name || 'Cliente',
          dropoff_phone_number: recipientPhone || undefined,
          manifest_items: manifestFromItems(items),
        }),
      })

      const delivery = await response.json().catch(() => ({}))
      if (!response.ok) {
        return json({
          error: 'uber_error',
          status: response.status,
          message: delivery.message || delivery.error || 'A Uber recusou o despacho.',
          details: delivery,
        }, 502)
      }

      await supabase
        .from('orders')
        .update({
          uber_delivery_id: delivery.id,
          tracking_url: delivery.tracking_url || null,
          shipping_provider: 'uber',
          shipping_quote_id: storedQuote,
        })
        .eq('id', orderId)

      return json({
        delivery_id: delivery.id,
        status: delivery.status,
        tracking_url: delivery.tracking_url,
        fee: delivery.fee,
        currency: delivery.currency,
      })
    }

    return json({ error: 'unknown_action', message: `Ação desconhecida: ${action}` }, 400)
  } catch (error) {
    return json({ error: 'internal_error', message: (error as Error).message }, 500)
  }
})
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * Uber Direct — cotação de entrega.
 *
 * O client_secret da Uber nunca pode chegar ao browser: esta function faz o
 * OAuth (client_credentials) e a chamada de delivery_quotes no servidor.
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
  dimensions?: { length?: number; height?: number; depth?: number }
}

// Cache de token por instância quente. A Uber devolve expires_in em segundos.
let cachedToken: { value: string; expiresAt: number } | null = null

const onlyDigits = (value: string | undefined) => (value || '').replace(/\D/g, '')

const formatCep = (zip: string | undefined) => {
  const digits = onlyDigits(zip)
  return digits.length === 8 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : (zip || '')
}

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
  const missing = !input.street || !input.city || !input.state
  if (!missing) return input
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { origin, destination, items } = await req.json() as {
      origin?: AddressInput
      destination?: AddressInput
      items?: QuoteItem[]
    }

    if (!destination?.zip && !destination?.street) {
      return new Response(
        JSON.stringify({ error: 'destination_required', message: 'Informe o CEP ou o endereço de entrega.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { clientId, clientSecret, customerId } = await getCredentials(supabase)

    if (!clientId || !clientSecret || !customerId) {
      return new Response(
        JSON.stringify({
          error: 'not_configured',
          message: 'Uber Direct sem credenciais: configure UBER_CLIENT_ID, UBER_CLIENT_SECRET e UBER_CUSTOMER_ID ou os campos em Configurações.',
        }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const [pickup, dropoff] = await Promise.all([
      resolveAddress(origin || {}),
      resolveAddress(destination),
    ])

    if (!pickup.street || !dropoff.street) {
      return new Response(
        JSON.stringify({
          error: 'address_unresolved',
          message: 'Não foi possível resolver o endereço de coleta ou entrega a partir do CEP.',
        }),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const token = await getAccessToken(clientId, clientSecret)

    const quoteResponse = await fetch(
      `${UBER_API}/v1/customers/${encodeURIComponent(customerId)}/delivery_quotes`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pickup_address: toUberAddress(pickup),
          dropoff_address: toUberAddress(dropoff),
          // Itens entram no payload de cotação quando a conta exige manifesto;
          // a Uber ignora campos extras que não usa na cotação.
          manifest_items: (items || []).map((item) => ({
            name: item.name || 'Presente',
            quantity: item.quantity ?? 1,
            weight: item.weight ? Math.max(1, Math.round(item.weight * 1000)) : 500,
            dimensions: item.dimensions,
          })),
        }),
      }
    )

    const quote = await quoteResponse.json().catch(() => ({}))

    if (!quoteResponse.ok) {
      return new Response(
        JSON.stringify({
          error: 'uber_error',
          status: quoteResponse.status,
          message: quote.message || quote.error || 'A Uber recusou a cotação.',
          details: quote,
        }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({
        quote_id: quote.id,
        fee: Number(quote.fee),
        currency: quote.currency || 'BRL',
        dropoff_eta: quote.dropoff_eta ?? null,
        duration: quote.duration ?? null,
        pickup_duration: quote.pickup_duration ?? null,
        expires: quote.expires ?? null,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'internal_error', message: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
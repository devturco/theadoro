
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Force a fresh deployment revision when the function config changes.
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const {
            gateway,
            paymentMethod,
            amount,
            customer,
            cardToken,
            installments,
            description,
            orderId,
            idempotencyKey
        } = await req.json()

        const sanitize = (str: string) => str ? str.replace(/\D/g, '') : ''
        const mergePixDetails = (current: any, next: any) => ({
            pix_code: current?.pix_code || next?.pix_code || null,
            pix_url: current?.pix_url || next?.pix_url || null,
            pix_expiration: current?.pix_expiration || next?.pix_expiration || null,
        })
        const extractPixDetails = (source: any) => {
            const candidates = [
                source,
                source?.pix,
                source?.transaction,
                source?.last_transaction,
                source?.gateway_response,
                source?.gateway_response?.pix,
                source?.gateway_response?.transaction,
                source?.gateway_response?.last_transaction,
                source?.charges?.[0],
                source?.charges?.[0]?.pix,
                source?.charges?.[0]?.transaction,
                source?.charges?.[0]?.last_transaction,
            ].filter(Boolean)

            return candidates.reduce(
                (acc, candidate) =>
                    mergePixDetails(acc, {
                        pix_code:
                            candidate?.qr_code ||
                            candidate?.emv ||
                            candidate?.copy_paste ||
                            candidate?.copy_and_paste ||
                            candidate?.pix_payload ||
                            candidate?.payload ||
                            null,
                        pix_url:
                            candidate?.qr_code_url ||
                            candidate?.pix_url ||
                            candidate?.qrcode_url ||
                            candidate?.url ||
                            null,
                        pix_expiration:
                            candidate?.expires_at ||
                            candidate?.expiration_date ||
                            candidate?.expires_on ||
                            candidate?.due_at ||
                            null,
                    }),
                { pix_code: null, pix_url: null, pix_expiration: null }
            )
        }
        const fetchPagarmeJson = async (path: string, secretKey: string) => {
            const response = await fetch(`https://api.pagar.me/core/v5${path}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Basic ' + btoa(secretKey + ':')
                }
            })

            if (!response.ok) {
                return null
            }

            return response.json()
        }
        const fetchPixDetailsWithRetry = async ({
            secretKey,
            orderId,
            chargeId,
            initialSources,
        }: {
            secretKey: string
            orderId?: string
            chargeId?: string
            initialSources?: any[]
        }) => {
            let pixDetails = { pix_code: null, pix_url: null, pix_expiration: null }

            for (const source of initialSources || []) {
                pixDetails = mergePixDetails(pixDetails, extractPixDetails(source))
            }

            const attemptDelays = [0, 400, 900, 1500]

            for (const delay of attemptDelays) {
                if (pixDetails.pix_code || pixDetails.pix_url) {
                    break
                }

                if (delay > 0) {
                    await wait(delay)
                }

                if (orderId) {
                    const orderData = await fetchPagarmeJson(`/orders/${orderId}`, secretKey)
                    if (orderData) {
                        pixDetails = mergePixDetails(pixDetails, extractPixDetails(orderData))
                    }
                }

                if (chargeId) {
                    const chargeData = await fetchPagarmeJson(`/charges/${chargeId}`, secretKey)
                    if (chargeData) {
                        pixDetails = mergePixDetails(pixDetails, extractPixDetails(chargeData))
                    }
                }
            }

            return pixDetails
        }

        // 1. Fetch Settings
        const { data: settings, error: settingsError } = await supabaseClient
            .from('site_settings')
            .select('*')
            .in('key', [
                'payment_pagarme_secret_key',
                'payment_pagarme_test_mode',
                'payment_pagarme_test_secret_key',
                'payment_asaas_api_key',
                'payment_asaas_wallet_id'
            ])

        if (settingsError) throw new Error('Failed to fetch settings')

        const getSetting = (key: string) => settings.find((s: any) => s.key === key)?.value

        let result: any;

        if (gateway === 'pagarme') {
            const parseBooleanSetting = (value: unknown) => value === true || value === 'true'
            const isTestMode = parseBooleanSetting(getSetting('payment_pagarme_test_mode'))
            const liveSecretKey = getSetting('payment_pagarme_secret_key')
            const testSecretKey = getSetting('payment_pagarme_test_secret_key')
            const secretKey = isTestMode ? (testSecretKey || liveSecretKey) : liveSecretKey

            if (!secretKey) {
                throw new Error('Pagar.me não configurado. Informe a Secret Key no admin.')
            }
            // const recipientId = getSetting('payment_pagarme_recipient_id') 

            // Pagar.me API Logic
            const response = await fetch('https://api.pagar.me/core/v5/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Basic ' + btoa(secretKey + ':'),
                    ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {})
                },
                body: JSON.stringify({
                    items: [{
                        amount: Math.round(amount * 100), // Pagar.me uses cents
                        description: description || 'Pedido TheAdoro',
                        quantity: 1,
                        code: 'order_item'
                    }],
                    customer: {
                        name: customer.name,
                        email: customer.email,
                        type: 'individual',
                        document: sanitize(customer.document), // CPF
                        phones: {
                            mobile_phone: {
                                country_code: '55',
                                area_code: sanitize(customer.phone).length > 11
                                    ? sanitize(customer.phone).substring(2, 4)
                                    : sanitize(customer.phone).substring(0, 2),
                                number: sanitize(customer.phone).length > 11
                                    ? sanitize(customer.phone).substring(4)
                                    : sanitize(customer.phone).substring(2)
                            }
                        }
                    },
                    payments: [{
                        payment_method: paymentMethod === 'pix' ? 'pix' : 'credit_card',
                        credit_card: paymentMethod === 'credit_card' ? {
                            card: {
                                number: cardToken.number,
                                holder_name: cardToken.name,
                                exp_month: parseInt(cardToken.expiry.split('/')[0]),
                                exp_year: parseInt('20' + cardToken.expiry.split('/')[1]),
                                cvv: cardToken.cvv
                            },
                            installments: installments || 1,
                            statement_descriptor: 'THEADORO'
                        } : undefined,
                        pix: paymentMethod === 'pix' ? {
                            expires_in: 3600 // 1 hour
                        } : undefined
                    }]
                })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(JSON.stringify(data))
            }

            const charge = data.charges[0]
            const pixDetails = paymentMethod === 'pix'
                ? await fetchPixDetailsWithRetry({
                    secretKey,
                    orderId: data.id,
                    chargeId: charge?.id,
                    initialSources: [data, charge],
                })
                : extractPixDetails(charge)

            result = {
                id: data.id,
                status: charge.status === 'paid' ? 'succeeded' : 'pending',
                pix_code: pixDetails.pix_code,
                pix_url: pixDetails.pix_url,
                pix_expiration: pixDetails.pix_expiration,
                is_test_mode: isTestMode,
                gateway_response: data
            }

        } else if (gateway === 'asaas') {
            const apiKey = getSetting('payment_asaas_api_key')
            const walletId = getSetting('payment_asaas_wallet_id')

            // Asaas Logic
            // First ensure customer exists (simplified for MVP: just create/get by email logic usually needed, but here simple create if not exists maybe?)
            // Actually Asaas allows creating payment with customer info directly or checking customer first. 
            // For this implementation, let's assuming we create a customer first or use existing logic if we had customer_id.
            // Simplification: Create new customer for every order (not ideal but works for mvp) or search by email.

            const customerResponse = await fetch('https://api.asaas.com/v3/customers?email=' + customer.email, {
                headers: { 'access_token': apiKey }
            })
            const customerData = await customerResponse.json()
            let asaasCustomerId = customerData.data?.[0]?.id

            if (!asaasCustomerId) {
                const newCustomer = await fetch('https://api.asaas.com/v3/customers', {
                    method: 'POST',
                    headers: { 'access_token': apiKey, 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: customer.name,
                        email: customer.email,
                        cpfCnpj: sanitize(customer.document)
                    })
                }).then(res => res.json())
                asaasCustomerId = newCustomer.id
            }

            const paymentBody: any = {
                customer: asaasCustomerId,
                billingType: paymentMethod === 'pix' ? 'PIX' : 'BOLETO',
                value: amount,
                dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 3 days
                description: description || 'Pedido TheAdoro'
            }

            if (walletId) {
                // simple split logic if needed
                // paymentBody.split = [...]
            }

            const response = await fetch('https://api.asaas.com/v3/payments', {
                method: 'POST',
                headers: {
                    'access_token': apiKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(paymentBody)
            })

            const data = await response.json()

            if (data.errors) {
                throw new Error(JSON.stringify(data.errors))
            }

            result = {
                id: data.id,
                status: 'pending',
                pix_code: data.pixQrCodeField, // Might need second call for QR Code sometimes
                boleto_url: data.bankSlipUrl,
                gateway_response: data
            }

            // If PIX, we might need to get QR Code payload
            if (paymentMethod === 'pix' && !data.pixQrCodeField) {
                const qrResponse = await fetch(`https://api.asaas.com/v3/payments/${data.id}/pixQrCode`, {
                    headers: { 'access_token': apiKey }
                })
                const qrData = await qrResponse.json()
                result.pix_code = qrData.payload
                result.pix_expiration = data.dueDate
            }

        } else {
            throw new Error('Gateway not supported')
        }

        return new Response(
            JSON.stringify(result),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    } catch (error) {
        return new Response(
            JSON.stringify({ error: (error as any).message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
})

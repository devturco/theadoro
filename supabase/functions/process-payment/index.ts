
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Force a fresh deployment revision when the function config changes.
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

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
            orderId
        } = await req.json()

        const sanitize = (str: string) => str ? str.replace(/\D/g, '') : ''

        // 1. Fetch Settings
        const { data: settings, error: settingsError } = await supabaseClient
            .from('site_settings')
            .select('*')
            .in('key', [
                'payment_pagarme_secret_key',
                'payment_asaas_api_key',
                'payment_asaas_wallet_id'
            ])

        if (settingsError) throw new Error('Failed to fetch settings')

        const getSetting = (key: string) => settings.find((s: any) => s.key === key)?.value

        let result: any;

        if (gateway === 'pagarme') {
            const secretKey = getSetting('payment_pagarme_secret_key')
            // const recipientId = getSetting('payment_pagarme_recipient_id') 

            // Pagar.me API Logic
            const response = await fetch('https://api.pagar.me/core/v5/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Basic ' + btoa(secretKey + ':')
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
            result = {
                id: data.id,
                status: charge.status === 'paid' ? 'succeeded' : 'pending',
                pix_code: charge.last_transaction?.qr_code,
                pix_expiration: charge.last_transaction?.expires_at,
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

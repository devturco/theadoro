import { supabase } from '@/integrations/supabase/client';
import { BaseService } from './base.service';

export type PaymentMethod = 'credit_card' | 'debit_card' | 'pix' | 'boleto';

export interface PaymentIntent {
    id: string;
    amount: number;
    status: 'pending' | 'succeeded' | 'failed' | 'requires_action';
    client_secret?: string; // For Stripe frontend
    pix_code?: string; // For PIX
    pix_url?: string;
    pix_expiration?: string;
    boleto_url?: string;
    is_test_mode?: boolean;
    gateway_error_message?: string;
}

export interface CreditCardData {
    number: string;
    name: string;
    expiry: string;
    cvv: string;
    installments: number;
}

export interface CardTokenizedData {
    token: string;
    installments: number;
}

export interface CustomerData {
    name: string;
    email: string;
    phone: string;
    document: string; // CPF/CNPJ
    code?: string;
    document_type?: 'CPF' | 'CNPJ';
    type?: 'individual' | 'company';
    metadata?: Record<string, unknown>;
    address?: {
        line_1: string;
        line_2?: string;
        zip_code: string;
        city: string;
        state: string;
        country: string;
    };
}

export interface PaymentOrderItem {
    amount: number;
    description: string;
    quantity: number;
    code?: string;
    category?: string;
}

export interface PaymentShippingData {
    amount: number;
    description?: string;
    recipient_name: string;
    recipient_phone: string;
    address: {
        line_1: string;
        line_2?: string;
        zip_code: string;
        city: string;
        state: string;
        country: string;
    };
    max_delivery_date?: string;
    estimated_delivery_date?: string;
    type?: string;
}

export interface PaymentRequestOptions {
    orderId?: string;
    idempotencyKey?: string;
    description?: string;
    orderCode?: string;
    items?: PaymentOrderItem[];
    shipping?: PaymentShippingData;
    billingAddress?: {
        line_1: string;
        line_2?: string;
        zip_code: string;
        city: string;
        state: string;
        country: string;
    };
}

interface PagarmeClientConfig {
    testMode: boolean;
    publicKey: string;
}

class PaymentService extends BaseService<any> {
    constructor() {
        super('orders'); // Base table just for consistency, but we mostly use edge functions
    }

    private async getFreshAccessToken(): Promise<string | null> {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            return null;
        }

        const expiresAtMs = (session.expires_at || 0) * 1000;
        const shouldRefresh = expiresAtMs > 0 && expiresAtMs <= Date.now() + 60_000;

        if (!shouldRefresh) {
            return session.access_token;
        }

        const { data, error } = await supabase.auth.refreshSession({
            refresh_token: session.refresh_token,
        });

        if (error) {
            throw new Error('Sua sessao expirou. Entre novamente para continuar o pagamento.');
        }

        return data.session?.access_token || null;
    }

    private async callProcessPayment(payload: Record<string, unknown>, retryOnUnauthorized = true): Promise<PaymentIntent> {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
        const accessToken = await this.getFreshAccessToken();

        const response = await fetch(`${supabaseUrl}/functions/v1/process-payment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                apikey: publishableKey,
                ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
            },
            body: JSON.stringify(payload),
        });

        if (response.status === 401 && retryOnUnauthorized) {
            const { data, error } = await supabase.auth.refreshSession();

            if (error || !data.session?.access_token) {
                throw new Error('Sua sessao expirou. Entre novamente para continuar o pagamento.');
            }

            return this.callProcessPayment(payload, false);
        }

        const responseText = await response.text();
        let parsed: any = null;

        if (responseText) {
            try {
                parsed = JSON.parse(responseText);
            } catch {
                parsed = { message: responseText };
            }
        }

        if (!response.ok) {
            const rawMessage =
                parsed?.error ||
                parsed?.message ||
                `Erro ao processar pagamento (${response.status})`;

            const message =
                response.status === 401 || rawMessage === 'Invalid JWT'
                    ? 'Sessao invalida no Supabase. Saia e entre novamente. Se continuar, a function process-payment do ambiente live ainda esta protegida por JWT ou foi publicada no projeto errado.'
                    : rawMessage;

            throw new Error(message);
        }

        return parsed as PaymentIntent;
    }

    async getPagarmeClientConfig(): Promise<PagarmeClientConfig> {
        const { data, error } = await supabase
            .from('site_settings' as any)
            .select('key, value')
            .in('key', [
                'payment_pagarme_test_mode',
                'payment_pagarme_public_key',
                'payment_pagarme_test_public_key',
            ]);

        if (error) {
            throw new Error('Não foi possível carregar a configuração pública do Pagar.me.');
        }

        const getSetting = (key: string) => data?.find((item: any) => item.key === key)?.value;
        const testMode = getSetting('payment_pagarme_test_mode') === true || getSetting('payment_pagarme_test_mode') === 'true';
        const publicKey = String(
            testMode
                ? (getSetting('payment_pagarme_test_public_key') || getSetting('payment_pagarme_public_key') || '')
                : (getSetting('payment_pagarme_public_key') || '')
        ).trim();

        if (!publicKey) {
            throw new Error('Public Key do Pagar.me não configurada.');
        }

        return { testMode, publicKey };
    }

    // Alternative path from the official docs for environments where tokenizecard.js cannot be embedded.
    async tokenizeCard(card: Omit<CreditCardData, 'installments'>): Promise<string> {
        const { publicKey } = await this.getPagarmeClientConfig();
        const [expMonth, expYear] = (card.expiry || '').split('/');

        const response = await fetch(`https://api.pagar.me/core/v5/tokens?appId=${encodeURIComponent(publicKey)}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                type: 'card',
                card: {
                    number: card.number.replace(/\s+/g, ''),
                    holder_name: card.name,
                    exp_month: parseInt(expMonth || '0', 10),
                    exp_year: parseInt(expYear || '0', 10),
                    cvv: card.cvv,
                },
            }),
        });

        const payload = await response.json().catch(() => null);

        if (!response.ok || !payload?.id) {
            const message =
                payload?.message ||
                payload?.error ||
                'Não foi possível tokenizar o cartão no Pagar.me.';
            throw new Error(message);
        }

        return payload.id as string;
    }

    /**
     * Process a credit card payment.
     * @param amount Amount in decimal (e.g. 150.50)
     * @param card Card data or token. Prefer token generated client-side via the official Pagar.me tokenizecard.js flow.
     * @param customer Real customer data from checkout
     */
    async processCard(
        amount: number,
        card: CreditCardData | CardTokenizedData,
        customer: CustomerData,
        options?: PaymentRequestOptions
    ): Promise<PaymentIntent> {
        return this.callProcessPayment({
            gateway: 'pagarme',
            paymentMethod: 'credit_card',
            amount,
            cardToken: card,
            installments: card.installments || 1,
            orderId: options?.orderId,
            idempotencyKey: options?.idempotencyKey,
            description: options?.description,
            orderCode: options?.orderCode,
            items: options?.items,
            shipping: options?.shipping,
            billingAddress: options?.billingAddress,
            customer: {
                name: customer.name,
                email: customer.email,
                document: customer.document,
                phone: customer.phone,
                address: customer.address,
                code: customer.code,
                type: customer.type,
                document_type: customer.document_type,
                metadata: customer.metadata,
            }
        });
    }

    async cancelRemoteOrder(providerTransactionId: string): Promise<void> {
        await this.callProcessPayment({
            gateway: 'pagarme',
            action: 'cancel_remote_order',
            providerTransactionId,
        });
    }

    /**
     * Generate a PIX code.
     */
    async generatePix(amount: number, customer: CustomerData, options?: PaymentRequestOptions): Promise<PaymentIntent> {
        return this.callProcessPayment({
            gateway: 'pagarme',
            paymentMethod: 'pix',
            amount,
            orderId: options?.orderId,
            idempotencyKey: options?.idempotencyKey,
            description: options?.description,
            orderCode: options?.orderCode,
            items: options?.items,
            shipping: options?.shipping,
            billingAddress: options?.billingAddress,
            customer: {
                name: customer.name,
                email: customer.email,
                document: customer.document,
                phone: customer.phone,
                address: customer.address,
                code: customer.code,
                type: customer.type,
                document_type: customer.document_type,
                metadata: customer.metadata,
            }
        });
    }

    /**
     * Generate Boleto.
     */
    async generateBoleto(amount: number, customer: CustomerData, options?: PaymentRequestOptions): Promise<PaymentIntent> {
        return this.callProcessPayment({
            gateway: 'pagarme',
            paymentMethod: 'boleto',
            amount,
            orderId: options?.orderId,
            idempotencyKey: options?.idempotencyKey,
            description: options?.description,
            orderCode: options?.orderCode,
            items: options?.items,
            shipping: options?.shipping,
            billingAddress: options?.billingAddress,
            customer: {
                name: customer.name,
                email: customer.email,
                document: customer.document,
                phone: customer.phone,
                address: customer.address,
                code: customer.code,
                type: customer.type,
                document_type: customer.document_type,
                metadata: customer.metadata,
            }
        });
    }
}

export const paymentService = new PaymentService();

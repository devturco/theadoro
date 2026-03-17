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
}

export interface CreditCardData {
    number: string;
    name: string;
    expiry: string;
    cvv: string;
    installments: number;
}

export interface CustomerData {
    name: string;
    email: string;
    phone: string;
    document: string; // CPF/CNPJ
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

    /**
     * Process a credit card payment.
     * @param amount Amount in decimal (e.g. 150.50)
     * @param card Card data or token. SECURITY: Use token from Pagarme.js/Stripe.js in production.
     * @param customer Real customer data from checkout
     */
    async processCard(amount: number, card: CreditCardData | { token: string }, customer: CustomerData): Promise<PaymentIntent> {
        return this.callProcessPayment({
            gateway: 'pagarme',
            paymentMethod: 'credit_card',
            amount,
            cardToken: card,
            installments: (card as CreditCardData).installments || 1,
            customer: {
                name: customer.name,
                email: customer.email,
                document: customer.document,
                phone: customer.phone
            }
        });
    }

    /**
     * Generate a PIX code.
     */
    async generatePix(amount: number, customer: CustomerData): Promise<PaymentIntent> {
        return this.callProcessPayment({
            gateway: 'pagarme',
            paymentMethod: 'pix',
            amount,
            customer: {
                name: customer.name,
                email: customer.email,
                document: customer.document,
                phone: customer.phone
            }
        });
    }

    /**
     * Generate Boleto.
     */
    async generateBoleto(amount: number, customer: CustomerData): Promise<PaymentIntent> {
        return this.callProcessPayment({
            gateway: 'pagarme',
            paymentMethod: 'boleto',
            amount,
            customer: {
                name: customer.name,
                email: customer.email,
                document: customer.document,
                phone: customer.phone
            }
        });
    }
}

export const paymentService = new PaymentService();

import { supabase } from '@/integrations/supabase/client';
import { BaseService } from './base.service';

export type PaymentMethod = 'credit_card' | 'debit_card' | 'pix' | 'boleto';

export interface PaymentIntent {
    id: string;
    amount: number;
    status: 'pending' | 'succeeded' | 'failed' | 'requires_action';
    client_secret?: string; // For Stripe frontend
    pix_code?: string; // For PIX
    pix_expiration?: string;
    boleto_url?: string;
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

    /**
     * Process a credit card payment.
     * @param amount Amount in decimal (e.g. 150.50)
     * @param card Card data or token. SECURITY: Use token from Pagarme.js/Stripe.js in production.
     * @param customer Real customer data from checkout
     */
    async processCard(amount: number, card: CreditCardData | { token: string }, customer: CustomerData): Promise<PaymentIntent> {
        const { data, error } = await supabase.functions.invoke('process-payment', {
            body: {
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
            }
        });

        if (error) throw new Error(error.message || 'Erro ao processar pagamento');
        return data as PaymentIntent;
    }

    /**
     * Generate a PIX code.
     */
    async generatePix(amount: number, customer: CustomerData): Promise<PaymentIntent> {
        const { data, error } = await supabase.functions.invoke('process-payment', {
            body: {
                gateway: 'asaas', 
                paymentMethod: 'pix',
                amount,
                customer: {
                    name: customer.name,
                    email: customer.email,
                    document: customer.document,
                    phone: customer.phone
                }
            }
        });

        if (error) throw new Error(error.message || 'Erro ao gerar Pix');
        return data as PaymentIntent;
    }

    /**
     * Generate Boleto.
     */
    async generateBoleto(amount: number, customer: CustomerData): Promise<PaymentIntent> {
        const { data, error } = await supabase.functions.invoke('process-payment', {
            body: {
                gateway: 'asaas',
                paymentMethod: 'boleto',
                amount,
                customer: {
                    name: customer.name,
                    email: customer.email,
                    document: customer.document,
                    phone: customer.phone
                }
            }
        });

        if (error) throw new Error(error.message || 'Erro ao gerar Boleto');
        return data as PaymentIntent;
    }
}

export const paymentService = new PaymentService();

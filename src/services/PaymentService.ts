import { supabase } from '@/integrations/supabase/client';

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

/**
 * Service to handle payments.
 * Connects to 'functions/process-payment' in production.
 */
export const PaymentService = {
    /**
     * Process a credit card payment.
     */
    processCard: async (amount: number, card: CreditCardData, customer?: CustomerData): Promise<PaymentIntent> => {
        // TODO: Get active gateway from settings or pass as argument
        // For now defaulting to 'pagarme' as it supports credit card
        const { data, error } = await supabase.functions.invoke('process-payment', {
            body: {
                gateway: 'pagarme',
                paymentMethod: 'credit_card',
                amount,
                cardToken: card,
                installments: card.installments,
                customer: customer || {
                    name: card.name,
                    email: 'customer@example.com', // Should be passed
                    document: '00000000000', // Should be passed
                    phone: '11999999999' // Should be passed
                }
            }
        });

        if (error) throw new Error(error.message || 'Erro ao processar pagamento');
        return data as PaymentIntent;
    },

    /**
     * Generate a PIX code.
     */
    generatePix: async (amount: number, customer?: CustomerData): Promise<PaymentIntent> => {
        // Defaulting to Asaas for Pix as per plan preference or either
        const { data, error } = await supabase.functions.invoke('process-payment', {
            body: {
                gateway: 'asaas', // or 'pagarme'
                paymentMethod: 'pix',
                amount,
                customer: customer || {
                    name: 'Cliente Teste',
                    email: 'cliente@teste.com',
                    document: '00000000000',
                    phone: '11999999999'
                }
            }
        });

        if (error) throw new Error(error.message || 'Erro ao gerar Pix');
        return data as PaymentIntent;
    },

    /**
     * Generate Boleto.
     */
    generateBoleto: async (amount: number, customer?: CustomerData): Promise<PaymentIntent> => {
        const { data, error } = await supabase.functions.invoke('process-payment', {
            body: {
                gateway: 'asaas',
                paymentMethod: 'boleto',
                amount,
                customer: customer || {
                    name: 'Cliente Teste',
                    email: 'cliente@teste.com',
                    document: '00000000000',
                    phone: '11999999999'
                }
            }
        });

        if (error) throw new Error(error.message || 'Erro ao gerar Boleto');
        return data as PaymentIntent;
    }
};

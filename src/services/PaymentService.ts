
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

/**
 * Service to handle payments.
 * Connects to 'functions/create-payment' in production.
 */
export const PaymentService = {
    /**
     * Process a credit card payment.
     */
    processCard: async (amount: number, card: CreditCardData): Promise<PaymentIntent> => {
        // Simulate API latency
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Simulate Validation
        if (card.number.length < 16) {
            throw new Error('Número de cartão inválido (simulação)');
        }

        return {
            id: `pi_${Math.random().toString(36).substring(2, 15)}`,
            amount,
            status: 'succeeded',
        };
    },

    /**
     * Generate a PIX code.
     */
    generatePix: async (amount: number): Promise<PaymentIntent> => {
        await new Promise(resolve => setTimeout(resolve, 1000));

        return {
            id: `pix_${Math.random().toString(36).substring(2, 15)}`,
            amount,
            status: 'pending',
            pix_code: '00020126580014BR.GOV.BCB.PIX0136123e4567-e89b-12d3-a456-426614174000520400005303986540510.005802BR5913Theo Gift Store6008Brasilia62070503***630460F4',
            pix_expiration: new Date(Date.now() + 30 * 60000).toISOString() // 30 minutes
        };
    },

    /**
     * Generate Boleto.
     */
    generateBoleto: async (amount: number): Promise<PaymentIntent> => {
        await new Promise(resolve => setTimeout(resolve, 1000));

        return {
            id: `bol_${Math.random().toString(36).substring(2, 15)}`,
            amount,
            status: 'pending',
            boleto_url: 'https://example.com/boleto.pdf'
        };
    }
};

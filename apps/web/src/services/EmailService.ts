
export interface EmailPayload {
    to: string;
    subject: string;
    template: 'order_confirmation' | 'shipping_update';
    data: any;
}

/**
 * Service to handle email sending.
 * Connects to 'functions/send-email' in production.
 */
export const EmailService = {
    /**
     * Send an email.
     */
    send: async (payload: EmailPayload): Promise<{ success: boolean; id?: string }> => {
        // Log briefly in development
        console.log(`[EmailService] Enviar mock para: ${payload.to} | Assunto: ${payload.subject}`);

        // Simulate API latency
        await new Promise(resolve => setTimeout(resolve, 500));

        return {
            success: true,
            id: `email_${Math.random().toString(36).substring(2, 10)}`
        };
    }
};

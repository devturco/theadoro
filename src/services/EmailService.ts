
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
        // Log to console to simulate sending
        console.group('📧 EmailService Mock Send');
        console.log(`To: ${payload.to}`);
        console.log(`Subject: ${payload.subject}`);
        console.log('Template:', payload.template);
        console.log('Data:', payload.data);
        console.groupEnd();

        // Simulate API latency
        await new Promise(resolve => setTimeout(resolve, 500));

        return {
            success: true,
            id: `email_${Math.random().toString(36).substring(2, 10)}`
        };
    }
};

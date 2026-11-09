import { supabase } from '@/integrations/supabase/client';

export interface EmailPayload {
    to: string;
    subject: string;
    template: 'order_confirmation' | 'shipping_update';
    data: any;
}

export interface EmailResult {
    success: boolean;
    id?: string;
    error?: string;
}

/**
 * Envia e-mail pela edge function `send-email`.
 *
 * Falha de e-mail nunca derruba o checkout: o pedido já foi criado e o
 * pagamento já foi processado. O erro fica registrado no console.
 */
export const EmailService = {
    send: async (payload: EmailPayload): Promise<EmailResult> => {
        try {
            const { data, error } = await supabase.functions.invoke('send-email', {
                body: payload,
            });

            if (error) {
                console.warn('[EmailService] envio falhou:', error.message);
                return { success: false, error: error.message };
            }

            if (data?.error) {
                console.warn('[EmailService] e-mail não enviado:', data.message || data.error);
                return { success: false, error: data.message || data.error };
            }

            return { success: true, id: data?.id };
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Erro ao enviar e-mail';
            console.warn('[EmailService] erro inesperado:', message);
            return { success: false, error: message };
        }
    }
};
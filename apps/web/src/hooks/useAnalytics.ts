import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Simple session management to track unique visitors 
// This persists until the browser tab is closed
const getSessionId = () => {
    let sessionId = sessionStorage.getItem('analytics_session_id');
    if (!sessionId) {
        // Fallback for random ID if crypto.randomUUID is not available
        sessionId = typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
        sessionStorage.setItem('analytics_session_id', sessionId);
    }
    return sessionId;
};

export type AnalyticsEventType = 'view' | 'click_buy' | 'whatsapp_click' | 'appointment_start';

export const useAnalytics = () => {
    const trackEvent = useCallback(async (
        productId: string,
        sellerId: string,
        eventType: AnalyticsEventType,
        metadata: Record<string, any> = {}
    ) => {
        try {
            if (!productId || !sellerId) {
                console.warn('[Analytics] Missing product or seller ID', { productId, sellerId });
                return;
            }

            const sessionId = getSessionId();
            console.log(`[Analytics] Tracking ${eventType} for product ${productId}...`);

            const { error } = await (supabase.from as any)('product_analytics')
                .insert({
                    product_id: productId,
                    seller_id: sellerId,
                    event_type: eventType,
                    session_id: sessionId,
                    metadata
                });

            if (error) {
                // Silently fail to not interrupt user experience
                console.warn('[Analytics] Failed to track event:', error.message);
            }
        } catch (e) {
            console.warn('[Analytics] Unexpected error:', e);
        }
    }, []);

    return { trackEvent };
};

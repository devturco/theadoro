
export interface ShippingQuote {
    service_id: number;
    name: string;
    price: number;
    estimated_delivery: string;
    delivery_days: number;
}

export interface ShippingRequest {
    zipCode: string;
    items: Array<{
        id: string;
        quantity: number;
        weight?: number; // in kg
        dimensions?: {
            width: number;
            height: number;
            length: number;
        };
    }>;
}

/**
 * Service to handle shipping calculations.
 * In production, this would communicate with your backend (Supabase Edge Function),
 * which in turn would call the Loggi API.
 */
export const LoggiService = {
    /**
     * Calculates shipping quotes.
     * Use this method to eventually call 'supabase.functions.invoke("shipping-quote")'
     */
    calculateShipping: async (data: ShippingRequest): Promise<ShippingQuote[]> => {
        // Simulate API latency
        await new Promise(resolve => setTimeout(resolve, 600));

        if (!data.zipCode || data.zipCode.length < 8) {
            throw new Error('CEP inválido');
        }

        // Simulate logic based on CEP region (1st digit)
        const regionFactor = parseInt(data.zipCode.charAt(0)) || 1;
        const basePrice = 10.00;

        // Calculate volumetric weight simulation
        const totalItems = data.items.reduce((acc, item) => acc + item.quantity, 0);
        const weightMult = 1.0 + (totalItems * 0.2); // +20% cost per item

        const standardPrice = (basePrice * regionFactor * 0.5) + (5 * weightMult);
        const expressPrice = standardPrice * 1.8;

        const deliveryDays = Math.max(2, regionFactor + 2); // Minimum 2 days, +1 per region distance

        return [
            {
                service_id: 1,
                name: 'Loggi Standard',
                price: Number(standardPrice.toFixed(2)),
                estimated_delivery: `${deliveryDays} a ${deliveryDays + 2} dias úteis`,
                delivery_days: deliveryDays + 2
            },
            {
                service_id: 2,
                name: 'Loggi Express',
                price: Number(expressPrice.toFixed(2)),
                estimated_delivery: `1 a ${Math.max(1, deliveryDays - 2)} dias úteis`,
                delivery_days: Math.max(1, deliveryDays - 2)
            }
        ];
    }
};

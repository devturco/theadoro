
import { supabase } from "@/integrations/supabase/client";

export interface ShippingOption {
    id: string;
    name: string;
    price: number;
    deliveryTime: number; // in days
    company: 'uber' | 'correios' | 'custom';
    error?: string;
    estimated_delivery?: string;
}

export interface ShippingItem {
    weight: number; // in kg
    width: number; // in cm
    height: number; // in cm
    length: number; // in cm
    quantity: number;
    price: number;
}

class ShippingService {
    private async getSettings() {
        const { data: settings } = await supabase
            .from('site_settings')
            .select('*')
            .in('section', ['general', 'integrations']);

        if (!settings) return null;

        const getVal = (key: string) => {
            const s = settings.find(x => x.key === key);
            if (!s) return null;
            
            try {
                if (s.type === 'boolean') return s.value === 'true' || s.value === true;
                if (typeof s.value === 'string' && s.value.startsWith('"') && s.value.endsWith('"')) {
                    return s.value.slice(1, -1);
                }
                return s.value;
            } catch (e) {
                return s.value;
            }
        };

        return {
            originCep: getVal('store_cep') || '01310-100', // Default if missing
            store: {
                street: String(getVal('store_address') || ''),
                city: String(getVal('store_city') || ''),
                state: String(getVal('store_state') || ''),
                zip: String(getVal('store_cep') || ''),
            },
            uber: {
                enabled: getVal('shipping_uber_enabled'),
                // Credenciais ficam só na edge function. O browser nunca as lê.
                tariff: Number(getVal('shipping_express_tariff') || 0)
            },
            correios: {
                enabled: getVal('shipping_correios_enabled'),
            }
        };
    }

    private async calculateUberDirect(
        origin: string,
        destination: string,
        items: ShippingItem[],
        store?: { street?: string; city?: string; state?: string; zip?: string },
        tariff = 0
    ): Promise<ShippingOption[]> {
        // A cotação é feita na edge function: o client_secret da Uber não pode
        // existir no bundle do browser.
        const { data, error } = await supabase.functions.invoke('uber-delivery-quote', {
            body: {
                origin: {
                    street: store?.street || undefined,
                    city: store?.city || undefined,
                    state: store?.state || undefined,
                    zip: store?.zip || origin,
                },
                destination: { zip: destination },
                items: items.map((item) => ({
                    name: 'Presente',
                    quantity: item.quantity,
                    weight: item.weight,
                })),
            },
        })

        if (error) throw new Error(`Uber: ${error.message}`)
        if (!data || data.error) throw new Error(`Uber: ${data?.message || 'cotação indisponível'}`)

        const fee = Number(data.fee)
        if (!Number.isFinite(fee) || fee <= 0) {
            throw new Error('Uber: cotação sem valor de frete')
        }

        // A tarifa configurada é um percentual de markup sobre o frete real da Uber.
        const finalPrice = fee * (1 + (Number(tariff) || 0) / 100)

        return [{
            id: String(data.quote_id || 'uber-direct'),
            name: 'Entrega Express',
            company: 'uber',
            price: Number(finalPrice.toFixed(2)),
            deliveryTime: 0,
            estimated_delivery: 'Até 90 minutos'
        }]
    }

    private async calculateCorreios(origin: string, destination: string, items: ShippingItem[]): Promise<ShippingOption[]> {
        // Mock for Correios/Sedex
        await new Promise(resolve => setTimeout(resolve, 600));

        const totalWeight = items.reduce((acc, item) => acc + (item.weight * item.quantity), 0);
        const sedexPrice = 28.90 + (totalWeight * 4);

        return [{
            id: 'correios-sedex',
            name: 'SEDEX',
            company: 'correios',
            price: Number(sedexPrice.toFixed(2)),
            deliveryTime: 2,
            estimated_delivery: '2 a 3 dias úteis'
        }];
    }

    async calculateShipping(destinationCep: string, items: ShippingItem[], sellerId?: string): Promise<ShippingOption[]> {
        const settings = await this.getSettings();
        if (!settings) return [];

        const cleanDest = destinationCep.replace(/\D/g, '');
        
        // 1. Validate Region (Cuiabá Check)
        // Range for Cuiabá is roughly 78000-000 to 78100-000
        const isCuiaba = cleanDest.startsWith('780') || cleanDest.startsWith('781');
        if (!isCuiaba) {
            return [{
                id: 'error-region',
                name: 'Região não atendida',
                price: 0,
                deliveryTime: -1,
                company: 'custom',
                error: 'No momento, entregamos apenas em Cuiabá/MT.'
            }];
        }

        const options: ShippingOption[] = [];
        let originCep = settings.originCep;

        // 2. Use Seller's specific CEP if provided
        if (sellerId) {
            const { data: sellerProfile } = await supabase
                .from('profiles')
                .select('postal_code')
                .eq('id', sellerId)
                .single();
            if (sellerProfile?.postal_code) {
                originCep = sellerProfile.postal_code;
            }
        }

        const promises = [];

        // 1. Uber Direct (Entrega Express)
        if (settings.uber.enabled) {
            promises.push(
                this.calculateUberDirect(originCep, destinationCep, items, settings.store, settings.uber.tariff)
                    .then(opts => options.push(...opts))
                    .catch(e => console.error("Uber error:", e))
            );
        }

        // 2. Correios (Sedex)
        if (settings.correios.enabled) {
            promises.push(
                this.calculateCorreios(originCep, destinationCep, items)
                    .then(opts => options.push(...opts))
                    .catch(e => console.error("Correios error:", e))
            );
        }

        await Promise.all(promises);
        return options.sort((a, b) => a.price - b.price);
    }
}

export const shippingService = new ShippingService();

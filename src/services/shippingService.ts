
import { supabase } from "@/integrations/supabase/client";

export interface ShippingOption {
    id: string;
    name: string;
    price: number;
    deliveryTime: number; // in days
    company: 'loggi' | 'correios' | 'custom';
    error?: string;
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
            try {
                if (s?.type === 'boolean') return s.value === 'true' || s.value === true;
                // Clean string quotes if present
                if (typeof s?.value === 'string' && s.value.startsWith('"') && s.value.endsWith('"')) {
                    return s.value.slice(1, -1);
                }
                return s?.value;
            } catch (e) {
                return s?.value;
            }
        };

        return {
            originCep: getVal('store_cep'),
            loggi: {
                enabled: getVal('shipping_loggi_enabled'),
                key: getVal('shipping_loggi_key'),
            },
            correios: {
                enabled: getVal('shipping_correios_enabled'),
            }
        };
    }

    // Mock calculation for Loggi
    private async calculateLoggi(origin: string, destination: string, items: ShippingItem[], key: string): Promise<ShippingOption[]> {
        // In a real backend, we would call Loggi API here.
        // For now, we simulate based on distance (CEP diff) and weight.

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 800));

        // Basic heuristic simulation
        const basePrice = 12.00;
        const weightPrice = items.reduce((acc, item) => acc + (item.weight * item.quantity), 0) * 0.5;

        return [
            {
                id: 'loggi-express',
                name: 'Loggi Express (Dia Seguinte)',
                company: 'loggi',
                price: basePrice + weightPrice,
                deliveryTime: 1
            },
            {
                id: 'loggi-turbo',
                name: 'Loggi Turbo (Chega em até 2h)',
                company: 'loggi',
                price: (basePrice + weightPrice) * 1.5,
                deliveryTime: 0
            },
            {
                id: 'loggi-flash',
                name: 'Loggi Flash (Chega em até 1h)',
                company: 'loggi',
                price: (basePrice + weightPrice) * 2.5,
                deliveryTime: 0
            }
        ];
    }

    // Mock calculation for Correios
    private async calculateCorreios(origin: string, destination: string, items: ShippingItem[]): Promise<ShippingOption[]> {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 600));

        const totalWeight = items.reduce((acc, item) => acc + (item.weight * item.quantity), 0);

        // PAC logic simulation
        const pacPrice = 18.50 + (totalWeight * 2);
        const pacDays = 5;

        // SEDEX logic simulation
        const sedexPrice = 28.90 + (totalWeight * 4);
        const sedexDays = 2;

        return [
            {
                id: 'correios-pac',
                name: 'PAC',
                company: 'correios',
                price: pacPrice,
                deliveryTime: pacDays
            },
            {
                id: 'correios-sedex',
                name: 'SEDEX',
                company: 'correios',
                price: sedexPrice,
                deliveryTime: sedexDays
            }
        ];
    }

    async calculateShipping(destinationCep: string, items: ShippingItem[]): Promise<ShippingOption[]> {
        const settings = await this.getSettings();
        const options: ShippingOption[] = [];
        const originCep = settings?.originCep;

        if (!originCep) {
            console.error("Store origin CEP not configured");
            return [];
        }

        // Parallel execution
        const promises = [];

        if (settings.loggi.enabled && settings.loggi.key) {
            promises.push(
                this.calculateLoggi(originCep, destinationCep, items, settings.loggi.key)
                    .then(opts => options.push(...opts))
                    .catch(e => console.error("Loggi error:", e))
            );
        }

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

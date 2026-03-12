
import { useState } from 'react';
import { shippingService, ShippingItem, ShippingOption } from '@/services/shippingService';
import { toast } from 'sonner';

export const useShipping = () => {
    const [loading, setLoading] = useState(false);
    const [options, setOptions] = useState<ShippingOption[]>([]);
    const [error, setError] = useState<string | null>(null);

    const calculateShipping = async (cep: string, items: ShippingItem[], sellerId?: string) => {
        try {
            setLoading(true);
            setError(null);
            setOptions([]);

            const result = await shippingService.calculateShipping(cep, items, sellerId);
            setOptions(result);

            if (result.length === 1 && result[0].id === 'error-region') {
                setError(result[0].error || "Região não atendida.");
            } else if (result.length === 0) {
                toast.error("Não foi possível calcular o frete para este CEP.");
            }
        } catch (err) {
            console.error(err);
            setError("Erro ao calcular frete");
            toast.error("Erro ao calcular frete. Tente novamente.");
        } finally {
            setLoading(false);
        }
    };

    return {
        calculateShipping,
        loading,
        options,
        error,
        clearShipping: () => setOptions([])
    };
};

import { useProductWizard } from '@/hooks/useProductWizard';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Truck, Weight, Box } from 'lucide-react';

export default function ShippingStep() {
    const { productType, productData, updateProductData } = useProductWizard();

    const handleChange = (field: string, value: string) => {
        const currentInfo = productData.shipping_info || {};
        updateProductData({
            shipping_info: {
                ...currentInfo,
                [field]: Number(value)
            }
        });
    };

    if (productType === 'digital' || productType === 'service') {
        return (
            <div className="space-y-6 animate-in slide-in-from-right-8 duration-500">
                <div className="text-center space-y-4 py-8">
                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Box className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-semibold text-gray-800">Tudo pronto!</h2>
                    <p className="text-gray-500 max-w-md mx-auto">
                        Como seu produto é {productType === 'digital' ? 'digital' : 'um serviço'},
                        não é necessário configurar frete. Revise suas informações e clique em "Finalizar e Publicar".
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in slide-in-from-right-8 duration-500">
            <div className="space-y-2">
                <h2 className="text-2xl font-semibold text-gray-800">Frete e Dimensões</h2>
                <p className="text-gray-500">Informações essenciais para o cálculo do frete.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <h3 className="font-medium flex items-center gap-2">
                        <Box className="h-4 w-4 text-wine" />
                        Dimensões da Embalagem
                    </h3>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label className="text-xs">Altura (cm)</Label>
                            <Input
                                placeholder="0"
                                type="number"
                                value={productData.shipping_info?.height || ''}
                                onChange={(e) => handleChange('height', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs">Largura (cm)</Label>
                            <Input
                                placeholder="0"
                                type="number"
                                value={productData.shipping_info?.width || ''}
                                onChange={(e) => handleChange('width', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs">Profundidade (cm)</Label>
                            <Input
                                placeholder="0"
                                type="number"
                                value={productData.shipping_info?.depth || ''}
                                onChange={(e) => handleChange('depth', e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <h3 className="font-medium flex items-center gap-2">
                        <Weight className="h-4 w-4 text-wine" />
                        Peso
                    </h3>
                    <div className="space-y-2">
                        <Label>Peso Total (kg)</Label>
                        <div className="relative">
                            <Input
                                type="number"
                                placeholder="0.000"
                                className="pr-8"
                                step="0.001"
                                value={productData.shipping_info?.weight || ''}
                                onChange={(e) => handleChange('weight', e.target.value)}
                            />
                            <span className="absolute right-3 top-2.5 text-gray-400 text-sm">kg</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Delivery Options */}
            <div className="space-y-4 pt-4 border-t border-gray-100">
                <h3 className="font-medium text-gray-800">Opções de Entrega Adicionais</h3>
                <div className="flex flex-col gap-3">
                    <div className="flex items-center space-x-2">
                        <Switch
                            id="express-delivery"
                            checked={productData.shipping_options?.express_delivery || false}
                            onCheckedChange={(checked) => updateProductData({
                                shipping_options: { ...productData.shipping_options, express_delivery: checked }
                            })}
                        />
                        <Label htmlFor="express-delivery">Entrega Expressa (Uber/Moto)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Switch
                            id="own-delivery"
                            checked={productData.shipping_options?.own_delivery || false}
                            onCheckedChange={(checked) => updateProductData({
                                shipping_options: { ...productData.shipping_options, own_delivery: checked }
                            })}
                        />
                        <Label htmlFor="own-delivery">Entrega Própria (A combinar)</Label>
                    </div>
                </div>
            </div>

            <div className="p-6 bg-blue-50 rounded-xl border border-blue-100 flex gap-4">
                <Truck className="h-6 w-6 text-blue-500 shrink-0" />
                <div className="space-y-1">
                    <h4 className="font-medium text-blue-900">Entrega via Correios e Transportadoras</h4>
                    <p className="text-sm text-blue-700">
                        O cálculo será feito automaticamente para o cliente baseado nessas dimensões.
                        Certifique-se de medir a caixa já embalada.
                    </p>
                </div>
            </div>
        </div>
    );
}

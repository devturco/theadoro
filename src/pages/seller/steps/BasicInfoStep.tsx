import { useProductWizard } from '@/hooks/useProductWizard';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FileUpload } from '@/components/ui/file-upload';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

export default function BasicInfoStep() {
    const { productData, updateProductData } = useProductWizard();

    const handleImageUpload = (urls: string[]) => {
        updateProductData({ images: [...(productData.images || []), ...urls] });
    };

    const handleImageRemove = (index: number) => {
        const newImages = (productData.images || []).filter((_, i) => i !== index);
        updateProductData({ images: newImages });
    };



    return (
        <div className="space-y-8 animate-in slide-in-from-right-8 duration-500">
            <div className="space-y-4">
                <h2 className="text-2xl font-semibold text-gray-800">Informações Básicas</h2>
                <p className="text-gray-500">Descreva seu produto para atrair compradores.</p>
            </div>

            <div className="grid gap-6">
                {/* Images */}
                <div className="space-y-4">
                    <Label className="text-sm font-semibold text-gray-700">Fotos do Produto</Label>
                    <div className="border-2 border-dashed border-gray-100 rounded-2xl p-6 bg-gray-50/50">
                        <FileUpload
                            onUpload={handleImageUpload}
                            accept="image/*"
                            multiple
                            maxFiles={5}
                            options={{ maxSize: 5 * 1024 * 1024 }}
                        />
                        {(productData.images?.length || 0) > 0 && (
                            <div className="grid grid-cols-5 gap-4 mt-6">
                                {productData.images?.map((url, index) => (
                                    <div key={index} className="relative aspect-square group">
                                        <img
                                            src={url}
                                            alt={`Produto ${index + 1}`}
                                            className="w-full h-full object-cover rounded-xl shadow-sm border border-white"
                                        />
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="sm"
                                            className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 shadow-lg scale-0 group-hover:scale-100 transition-transform"
                                            onClick={() => handleImageRemove(index)}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label>Título do Anúncio</Label>
                        <Input
                            value={productData.name}
                            onChange={(e) => {
                                updateProductData({ name: e.target.value });
                            }}
                            placeholder="Ex: Camiseta Algodão Premium"
                            className="h-12 rounded-xl"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Marca (Opcional)</Label>
                        <Input
                            value={productData.brand || ''}
                            onChange={(e) => updateProductData({ brand: e.target.value })}
                            placeholder="Ex: Nike, Adidas, Própria"
                            className="h-12 rounded-xl"
                        />
                    </div>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <Label>Preço (R$)</Label>
                        <Input
                            type="number"
                            value={productData.price}
                            onChange={(e) => updateProductData({ price: parseFloat(e.target.value) || 0 })}
                            className="h-12 rounded-xl"
                            min="0"
                            step="0.01"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Preço Original (De / Opcional)</Label>
                        <Input
                            type="number"
                            value={productData.original_price || ''}
                            onChange={(e) => updateProductData({ original_price: parseFloat(e.target.value) || 0 })}
                            className="h-12 rounded-xl"
                            min="0"
                            step="0.01"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Estoque Inicial</Label>
                        <Input
                            type="number"
                            value={productData.stock_quantity}
                            onChange={(e) => updateProductData({ stock_quantity: parseInt(e.target.value) || 0 })}
                            className="h-12 rounded-xl"
                            min="0"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>Descrição</Label>
                    <Textarea
                        value={productData.description}
                        onChange={(e) => updateProductData({ description: e.target.value })}
                        placeholder="Conte a história do seu produto, materiais utilizados, prazos, etc."
                        rows={6}
                        className="rounded-xl resize-none"
                    />
                </div>
            </div>
        </div>
    );
}

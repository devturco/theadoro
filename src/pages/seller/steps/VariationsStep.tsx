import { useState } from 'react';
import { useProductWizard } from '@/hooks/useProductWizard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, X, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';

export default function VariationsStep() {
    const { variations, addVariation, removeVariation, updateVariation, productData } = useProductWizard();
    const [hasVariations, setHasVariations] = useState(variations.length > 0);

    // Temporary state for generating variations
    const [colors, setColors] = useState<string[]>([]);
    const [sizes, setSizes] = useState<string[]>([]);
    const [tempColor, setTempColor] = useState('');
    const [tempSize, setTempSize] = useState('');

    const handleAddColor = () => {
        if (tempColor && !colors.includes(tempColor)) {
            setColors([...colors, tempColor]);
            setTempColor('');
        }
    };

    const handleAddSize = () => {
        if (tempSize && !sizes.includes(tempSize)) {
            setSizes([...sizes, tempSize]);
            setTempSize('');
        }
    };

    const generateCombinations = () => {
        const newVariations = [];

        // Check existing variations to avoid duplicates
        const isDuplicate = (color?: string, size?: string) => {
            return variations.some(v => v.color === color && v.size === size);
        };

        if (colors.length > 0 && sizes.length > 0) {
            // Cartesian product
            for (const color of colors) {
                for (const size of sizes) {
                    if (!isDuplicate(color, size)) {
                        newVariations.push({
                            color,
                            size,
                            stock_quantity: 0,
                            price: productData?.price || 0,
                            sku: `` // Could generate a suggested SKU here
                        });
                    }
                }
            }
        } else if (colors.length > 0) {
            for (const color of colors) {
                if (!isDuplicate(color, undefined)) {
                    newVariations.push({
                        color,
                        stock_quantity: 0,
                        price: productData?.price || 0
                    });
                }
            }
        } else if (sizes.length > 0) {
            for (const size of sizes) {
                if (!isDuplicate(undefined, size)) {
                    newVariations.push({
                        size,
                        stock_quantity: 0,
                        price: productData?.price || 0
                    });
                }
            }
        }

        // Add only new variations
        newVariations.forEach(v => addVariation(v));

        // Optional: Clear generators after generation?
        // setColors([]);
        // setSizes([]);
    };

    return (
        <div className="space-y-8 animate-in slide-in-from-right-8 duration-500">
            <div className="bg-wine/5 p-6 rounded-2xl border border-wine/10 flex items-center justify-between">
                <div className="space-y-1">
                    <h2 className="text-xl font-bold text-wine">Variações de Tamanho e Cor</h2>
                    <p className="text-sm text-gray-600">Ative se o seu produto tiver diferentes opções (ex: P, M, G ou cores variadas).</p>
                </div>
                <div className="flex items-center space-x-3 bg-white p-3 rounded-xl shadow-sm border border-gray-100">
                    <Label className="font-bold text-gray-700">Habilitar?</Label>
                    <Switch
                        checked={hasVariations}
                        onCheckedChange={setHasVariations}
                    />
                </div>
            </div>

            {hasVariations && (
                <div className="space-y-8">
                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Sizes */}
                        <div className="space-y-4 p-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                    <span className="font-bold text-xs">T</span>
                                </div>
                                <Label className="text-lg font-bold">Tamanhos</Label>
                            </div>
                            
                            <div className="space-y-3">
                                <p className="text-xs text-gray-500">Sugestões rápidas:</p>
                                <div className="flex flex-wrap gap-2">
                                    {['P', 'M', 'G', 'GG', 'Único'].map(s => (
                                        <Button 
                                            key={s} 
                                            variant="outline" 
                                            size="sm" 
                                            className="h-7 px-3 text-[10px] font-bold border-blue-100 hover:bg-blue-50 hover:text-blue-700"
                                            onClick={() => {
                                                if (!sizes.includes(s)) setSizes([...sizes, s]);
                                            }}
                                        >
                                            + {s}
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-2 pt-2">
                                <Input
                                    value={tempSize}
                                    onChange={(e) => setTempSize(e.target.value)}
                                    placeholder="Outro (ex: 42, 500ml)"
                                    className="bg-gray-50 border-gray-200 focus:bg-white transition-colors h-10 text-sm"
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddSize()}
                                />
                                <Button
                                    onClick={handleAddSize}
                                    size="icon"
                                    className="bg-gray-900 hover:bg-black text-white shrink-0 h-10 w-10"
                                >
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                            <div className="flex flex-wrap gap-2 min-h-[32px] pt-2">
                                {sizes.map((size) => (
                                    <Badge key={size} variant="secondary" className="px-3 py-1.5 text-sm bg-blue-50 hover:bg-blue-100 border border-blue-100 text-blue-700 flex items-center gap-2 transition-all">
                                        {size}
                                        <button onClick={() => setSizes(sizes.filter(s => s !== size))} className="text-blue-400 hover:text-red-500 transition-colors">
                                            <X className="h-3 w-3" />
                                        </button>
                                    </Badge>
                                ))}
                            </div>
                        </div>

                        {/* Colors */}
                        <div className="space-y-4 p-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="p-2 bg-pink-50 text-pink-600 rounded-lg">
                                    <span className="font-bold text-xs">C</span>
                                </div>
                                <Label className="text-lg font-bold">Cores</Label>
                            </div>
                            <p className="text-xs text-gray-500 mb-2">Adicione cores como: Vermelho, Azul, Estampado, etc.</p>
                            <div className="flex gap-2">
                                <Input
                                    value={tempColor}
                                    onChange={(e) => setTempColor(e.target.value)}
                                    placeholder="Ex: Cor Branca"
                                    className="bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddColor()}
                                />
                                <Button
                                    onClick={handleAddColor}
                                    size="icon"
                                    className="bg-gray-900 hover:bg-black text-white shrink-0"
                                >
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                            <div className="flex flex-wrap gap-2 min-h-[32px]">
                                {colors.map((color) => (
                                    <Badge key={color} variant="secondary" className="px-3 py-1.5 text-sm bg-pink-50 hover:bg-pink-100 border border-pink-100 text-pink-700 flex items-center gap-2 transition-all">
                                        {color}
                                        <button onClick={() => setColors(colors.filter(c => c !== color))} className="text-pink-400 hover:text-red-500 transition-colors">
                                            <X className="h-3 w-3" />
                                        </button>
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <Button
                            onClick={generateCombinations}
                            disabled={colors.length === 0 && sizes.length === 0}
                            className="bg-wine hover:bg-wine/90 text-white shadow-wine transition-all"
                        >
                            Gerar Combinações
                        </Button>
                    </div>

                    {/* List of Variations */}
                    {variations.length > 0 && (
                        <div className="space-y-4">
                            <h3 className="font-medium text-gray-700">Lista de Variações ({variations.length})</h3>
                            <div className="border rounded-xl overflow-hidden">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50 text-gray-500 font-medium border-b">
                                        <tr>
                                            <th className="p-4">Variação</th>
                                            <th className="p-4">SKU</th>
                                            <th className="p-4">Estoque</th>
                                            <th className="p-4">Preço (R$)</th>
                                            <th className="p-4 w-10"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {variations.map((variation, index) => (
                                            <tr key={index} className="bg-white hover:bg-gray-50/50">
                                                <td className="p-4 font-medium">
                                                    {variation.color && <Badge variant="outline" className="mr-2">{variation.color}</Badge>}
                                                    {variation.size && <Badge variant="outline">{variation.size}</Badge>}
                                                </td>
                                                <td className="p-4">
                                                    <Input
                                                        value={variation.sku || ''}
                                                        onChange={(e) => updateVariation(index, { sku: e.target.value })}
                                                        className="h-9 w-32"
                                                        placeholder="Código"
                                                    />
                                                </td>
                                                <td className="p-4">
                                                    <Input
                                                        type="number"
                                                        value={variation.stock_quantity || 0}
                                                        onChange={(e) => updateVariation(index, { stock_quantity: parseInt(e.target.value) })}
                                                        className="h-9 w-24"
                                                    />
                                                </td>
                                                <td className="p-4">
                                                    <Input
                                                        type="number"
                                                        value={variation.price || 0}
                                                        onChange={(e) => updateVariation(index, { price: parseFloat(e.target.value) })}
                                                        className="h-9 w-28"
                                                        placeholder="Padrão"
                                                    />
                                                </td>
                                                <td className="p-4">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-gray-400 hover:text-red-500"
                                                        onClick={() => removeVariation(index)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {!hasVariations && (
                <div className="p-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    <p className="text-gray-500">Este produto não possui variações. O estoque será gerenciado pelo produto principal.</p>
                </div>
            )}
        </div>
    );
}

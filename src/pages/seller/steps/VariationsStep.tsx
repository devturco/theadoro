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
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h2 className="text-2xl font-semibold text-gray-800">Variações do Produto</h2>
                    <p className="text-gray-500">Seu produto tem diferentes cores ou tamanhos?</p>
                </div>
                <div className="flex items-center space-x-2">
                    <Switch
                        checked={hasVariations}
                        onCheckedChange={setHasVariations}
                    />
                    <Label>Habilitar Variações</Label>
                </div>
            </div>

            {hasVariations && (
                <div className="space-y-8">
                    {/* Generators */}
                    <div className="grid md:grid-cols-2 gap-8 p-6 bg-white rounded-2xl border border-gray-200 shadow-sm">
                        {/* Colors */}
                        <div className="space-y-4">
                            <Label className="text-base font-medium">Cores Disponíveis</Label>
                            <div className="flex gap-2">
                                <Input
                                    value={tempColor}
                                    onChange={(e) => setTempColor(e.target.value)}
                                    placeholder="Digite uma cor e pressione Enter"
                                    className="bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddColor()}
                                />
                                <Button
                                    onClick={handleAddColor}
                                    size="icon"
                                    className="bg-gray-900 hover:bg-gray-800 text-white shrink-0"
                                >
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                            <div className="flex flex-wrap gap-2 min-h-[32px]">
                                {colors.map((color) => (
                                    <Badge key={color} variant="secondary" className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 border border-gray-200 text-gray-700 flex items-center gap-2 transition-all">
                                        {color}
                                        <button onClick={() => setColors(colors.filter(c => c !== color))} className="text-gray-400 hover:text-red-500 transition-colors">
                                            <X className="h-3 w-3" />
                                        </button>
                                    </Badge>
                                ))}
                                {colors.length === 0 && (
                                    <span className="text-sm text-gray-400 italic">Nenhuma cor adicionada</span>
                                )}
                            </div>
                        </div>

                        {/* Sizes */}
                        <div className="space-y-4">
                            <Label className="text-base font-medium">Tamanhos Disponíveis</Label>
                            <div className="flex gap-2">
                                <Input
                                    value={tempSize}
                                    onChange={(e) => setTempSize(e.target.value)}
                                    placeholder="Digite um tamanho e pressione Enter"
                                    className="bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddSize()}
                                />
                                <Button
                                    onClick={handleAddSize}
                                    size="icon"
                                    className="bg-gray-900 hover:bg-gray-800 text-white shrink-0"
                                >
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                            <div className="flex flex-wrap gap-2 min-h-[32px]">
                                {sizes.map((size) => (
                                    <Badge key={size} variant="secondary" className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 border border-gray-200 text-gray-700 flex items-center gap-2 transition-all">
                                        {size}
                                        <button onClick={() => setSizes(sizes.filter(s => s !== size))} className="text-gray-400 hover:text-red-500 transition-colors">
                                            <X className="h-3 w-3" />
                                        </button>
                                    </Badge>
                                ))}
                                {sizes.length === 0 && (
                                    <span className="text-sm text-gray-400 italic">Nenhum tamanho adicionado</span>
                                )}
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

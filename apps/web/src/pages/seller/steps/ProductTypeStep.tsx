import { useProductWizard } from '@/hooks/useProductWizard';
import { Label } from '@theadoro/ui';
import { RadioGroup, RadioGroupItem } from '@theadoro/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@theadoro/ui';
import { Package, Truck, Calendar, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCRUD } from '@/hooks/useCRUD';

export default function ProductTypeStep() {
    const { productType, setProductType, categoryId, subcategoryId, setCategory } = useProductWizard();
    const { data: categories } = useCRUD({ table: 'categories' });

    // Filter parent categories (where parent_id is null)
    const parentCategories = categories?.filter((c: any) => !c.parent_id) || [];

    // Filter subcategories based on selected parent
    const subCategories = categoryId
        ? categories?.filter((c: any) => c.parent_id === categoryId) || []
        : [];

    return (
        <div className="space-y-8 animate-in slide-in-from-right-8 duration-500">
            <div className="space-y-4">
                <h2 className="text-2xl font-semibold text-gray-800">O que você vai anunciar?</h2>
                <p className="text-gray-500">Escolha o tipo de produto para começarmos.</p>

                <RadioGroup
                    value={productType}
                    onValueChange={(val: any) => setProductType(val)}
                    className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4"
                >
                    {/* Physical Product */}
                    <Label
                        htmlFor="physical"
                        className={cn(
                            "flex flex-col items-center justify-center p-6 rounded-2xl border-2 cursor-pointer transition-all hover:border-wine/50 hover:bg-wine/5",
                            productType === 'physical' ? "border-wine bg-wine/5 ring-1 ring-wine" : "border-gray-100 bg-white"
                        )}
                    >
                        <RadioGroupItem value="physical" id="physical" className="sr-only" />
                        <div className={cn("p-4 rounded-full mb-4", productType === 'physical' ? "bg-wine text-white" : "bg-gray-100 text-gray-500")}>
                            <Package className="h-6 w-6" />
                        </div>
                        <span className="font-semibold text-lg mb-1">Produto Físico</span>
                        <span className="text-xs text-center text-gray-500">Itens tangíveis que requerem envio ou entrega.</span>
                    </Label>

                    {/* Service */}
                    <Label
                        htmlFor="service"
                        className={cn(
                            "flex flex-col items-center justify-center p-6 rounded-2xl border-2 cursor-pointer transition-all hover:border-wine/50 hover:bg-wine/5",
                            productType === 'service' ? "border-wine bg-wine/5 ring-1 ring-wine" : "border-gray-100 bg-white"
                        )}
                    >
                        <RadioGroupItem value="service" id="service" className="sr-only" />
                        <div className={cn("p-4 rounded-full mb-4", productType === 'service' ? "bg-wine text-white" : "bg-gray-100 text-gray-500")}>
                            <Calendar className="h-6 w-6" />
                        </div>
                        <span className="font-semibold text-lg mb-1">Serviço</span>
                        <span className="text-xs text-center text-gray-500">Serviços prestados presencialmente ou online.</span>
                    </Label>

                    {/* Digital Product */}
                    <Label
                        htmlFor="digital"
                        className={cn(
                            "flex flex-col items-center justify-center p-6 rounded-2xl border-2 cursor-pointer transition-all hover:border-wine/50 hover:bg-wine/5",
                            productType === 'digital' ? "border-wine bg-wine/5 ring-1 ring-wine" : "border-gray-100 bg-white"
                        )}
                    >
                        <RadioGroupItem value="digital" id="digital" className="sr-only" />
                        <div className={cn("p-4 rounded-full mb-4", productType === 'digital' ? "bg-wine text-white" : "bg-gray-100 text-gray-500")}>
                            <Download className="h-6 w-6" />
                        </div>
                        <span className="font-semibold text-lg mb-1">Produto Digital</span>
                        <span className="text-xs text-center text-gray-500">Arquivos para download (E-books, Artes, etc).</span>
                    </Label>
                </RadioGroup>
            </div>

            <div className="space-y-4 pt-4">
                <h2 className="text-xl font-semibold text-gray-800">Classificação</h2>
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label>Categoria Principal</Label>
                        <Select
                            value={categoryId}
                            onValueChange={(val) => setCategory(val)}
                        >
                            <SelectTrigger className="h-12 rounded-xl">
                                <SelectValue placeholder="Selecione a categoria" />
                            </SelectTrigger>
                            <SelectContent>
                                {parentCategories.map((c: any) => (
                                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Subcategoria (Opcional)</Label>
                        <Select
                            value={subcategoryId || ''}
                            onValueChange={(val) => setCategory(categoryId, val)}
                            disabled={!categoryId || subCategories.length === 0}
                        >
                            <SelectTrigger className="h-12 rounded-xl">
                                <SelectValue placeholder={subCategories.length === 0 ? "Nenhuma subcategoria disponível" : "Selecione a subcategoria"} />
                            </SelectTrigger>
                            <SelectContent>
                                {subCategories.map((c: any) => (
                                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>
        </div>
    );
}

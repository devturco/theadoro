import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@theadoro/ui';
import { Button } from '@theadoro/ui';
import { Input } from '@theadoro/ui';
import { Label } from '@theadoro/ui';
import { Textarea } from '@theadoro/ui';
import { Switch } from '@theadoro/ui';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@theadoro/ui';
import { FileUpload } from '@/components/ui/file-upload';
import { useAuth } from '@/contexts/AuthContext';
import { useProducts } from '@/hooks/useProducts';
import { useCRUD } from '@/hooks/useCRUD';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, BadgePercent } from 'lucide-react';
import { ProductType } from '@/types/product';
import { productService } from '@/services/product.service';
import { DEFAULT_FREE_SHIPPING_THRESHOLD } from '@/lib/freeShipping';



export default function SellerProductForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loadingProduct, setLoadingProduct] = useState(!!id);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: 0,
        stock_quantity: 0,
        category_id: '',
        type: 'physical' as ProductType,
        is_active: true,
        images: [] as string[],
        slug: '',
        shipping_options: {
            free_shipping_enabled: false,
            free_shipping_threshold: null as number | null,
        }
    });

    const { createProduct, updateProduct } = useProducts();
    const { data: categories } = useCRUD({ table: 'categories' });

    useEffect(() => {
        if (id) {
            fetchProduct();
        }
    }, [id]);

    const fetchProduct = async () => {
        try {
            const { data, error } = await productService.getByIdOrSlug(id!);

            if (error) throw error;
            if (data) {
                setFormData({
                    name: data.name,
                    description: data.description || '',
                    price: data.price,
                    stock_quantity: data.stock_quantity || 0,
                    category_id: data.category_id || '',
                    type: data.type as ProductType || 'physical',
                    is_active: data.is_active !== undefined ? data.is_active : true,
                    images: data.images || [],
                    slug: (data as any).slug || '',
                    shipping_options: {
                        ...(data.shipping_options || {}),
                        free_shipping_enabled: Boolean(data.shipping_options?.free_shipping_enabled),
                        free_shipping_threshold: data.shipping_options?.free_shipping_threshold
                            ? Number(data.shipping_options.free_shipping_threshold)
                            : null,
                    }
                });
            }
        } catch (error) {
            console.error('Erro ao carregar produto:', error);
            toast.error('Produto não encontrado');
            navigate('/seller/products');
        } finally {
            setLoadingProduct(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setSaving(true);
        try {
            const payload = {
                ...formData,
                shipping_options: {
                    ...formData.shipping_options,
                    free_shipping_enabled: Boolean(formData.shipping_options?.free_shipping_enabled),
                    free_shipping_threshold: formData.shipping_options?.free_shipping_enabled
                        ? (Number(formData.shipping_options?.free_shipping_threshold) || DEFAULT_FREE_SHIPPING_THRESHOLD)
                        : null,
                }
            };

            if (id) {
                await updateProduct(id, payload);
                toast.success('Anúncio atualizado com sucesso!');
            } else {
                await createProduct({
                    ...payload,
                    seller_id: user.id
                });
                toast.success('Anúncio criado com sucesso!');
            }
            navigate('/seller/products');
        } catch (error) {
            console.error('Erro ao salvar anúncio:', error);
            toast.error('Erro ao salvar anúncio');
        } finally {
            setSaving(false);
        }
    };

    const handleImageUpload = (urls: string[]) => {
        setFormData({ ...formData, images: [...formData.images, ...urls] });
    };

    const handleImageRemove = (index: number) => {
        const newImages = formData.images.filter((_, i) => i !== index);
        setFormData({ ...formData, images: newImages });
    };

    const handleFreeShippingToggle = (checked: boolean) => {
        setFormData({
            ...formData,
            shipping_options: {
                ...formData.shipping_options,
                free_shipping_enabled: checked,
                free_shipping_threshold: checked
                    ? (formData.shipping_options?.free_shipping_threshold || DEFAULT_FREE_SHIPPING_THRESHOLD)
                    : null,
            }
        });
    };

    if (loadingProduct) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-wine" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto animate-in fade-in duration-500">
            <div className="mb-6 flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate('/seller/products')}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold font-sans text-gradient-wine">
                        {id ? 'Editar Anúncio' : 'Criar Novo Anúncio'}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Configure os detalhes do seu produto para o catálogo
                    </p>
                </div>
            </div>

            <Card className="border-gray-100 shadow-xl rounded-2xl overflow-hidden">
                <CardContent className="p-8">
                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="grid gap-6">
                            {/* Basic Info */}
                            <div className="grid gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="name" className="text-sm font-semibold text-gray-700">Título do Anúncio</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => {
                                            const name = e.target.value;
                                            setFormData({
                                                ...formData,
                                                name
                                            });
                                        }}
                                        placeholder="Ex: Colar de Prata com Pingente"
                                        className="h-11 rounded-xl"
                                        required
                                    />
                                </div>



                                <div className="grid gap-2">
                                    <Label htmlFor="description" className="text-sm font-semibold text-gray-700">Descrição Detalhada</Label>
                                    <Textarea
                                        id="description"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        rows={5}
                                        placeholder="Conte a história do seu produto, materiais utilizados, prazos, etc."
                                        className="rounded-xl resize-none"
                                    />
                                </div>
                            </div>

                            {/* Pricing & Category */}
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="grid gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="price" className="text-sm font-semibold text-gray-700">Preço de Venda (R$)</Label>
                                        <Input
                                            id="price"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={formData.price}
                                            onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                                            className="h-11 rounded-xl"
                                            required
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="stock" className="text-sm font-semibold text-gray-700">Quantidade em Estoque</Label>
                                        <Input
                                            id="stock"
                                            type="number"
                                            min="0"
                                            value={formData.stock_quantity}
                                            onChange={(e) => setFormData({ ...formData, stock_quantity: parseInt(e.target.value) || 0 })}
                                            className="h-11 rounded-xl"
                                        />
                                    </div>
                                </div>

                                <div className="grid gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="category" className="text-sm font-semibold text-gray-700">Categoria</Label>
                                        <Select
                                            value={formData.category_id}
                                            onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                                        >
                                            <SelectTrigger className="h-11 rounded-xl">
                                                <SelectValue placeholder="Selecione uma categoria" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {categories?.map((category: any) => (
                                                    <SelectItem key={category.id} value={category.id}>
                                                        {category.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="type" className="text-sm font-semibold text-gray-700">Tipo de Entrega</Label>
                                        <Select
                                            value={formData.type}
                                            onValueChange={(value: ProductType) => setFormData({ ...formData, type: value })}
                                        >
                                            <SelectTrigger className="h-11 rounded-xl">
                                                <SelectValue placeholder="Selecione o tipo" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="physical">Produto Físico (Envio)</SelectItem>
                                                <SelectItem value="service">Serviço (Agendamento)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>

                            <div className="grid gap-4 rounded-2xl border border-gray-100 p-5 bg-gray-50/40">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <BadgePercent className="h-4 w-4 text-wine" />
                                            <Label className="text-sm font-semibold text-gray-700">Frete gratis no carrinho</Label>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            Mostre o aviso de frete gratis quando este anuncio atingir um valor minimo no carrinho.
                                        </p>
                                    </div>
                                    <Switch
                                        checked={Boolean(formData.shipping_options?.free_shipping_enabled)}
                                        onCheckedChange={handleFreeShippingToggle}
                                    />
                                </div>

                                {formData.shipping_options?.free_shipping_enabled && (
                                    <div className="grid gap-2 max-w-xs">
                                        <Label htmlFor="free_shipping_threshold" className="text-sm font-semibold text-gray-700">
                                            Valor minimo do carrinho (R$)
                                        </Label>
                                        <Input
                                            id="free_shipping_threshold"
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={formData.shipping_options?.free_shipping_threshold || ''}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                shipping_options: {
                                                    ...formData.shipping_options,
                                                    free_shipping_threshold: e.target.value ? Number(e.target.value) : null,
                                                }
                                            })}
                                            className="h-11 rounded-xl"
                                            placeholder={DEFAULT_FREE_SHIPPING_THRESHOLD.toString()}
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Images */}
                            <div className="grid gap-4">
                                <Label className="text-sm font-semibold text-gray-700">Fotos do Produto</Label>
                                <div className="border-2 border-dashed border-gray-100 rounded-2xl p-6 bg-gray-50/50">
                                    <FileUpload
                                        onUpload={handleImageUpload}
                                        accept="image/*"
                                        multiple
                                        maxFiles={5}
                                        options={{ maxSize: 5 * 1024 * 1024 }}
                                    />
                                    {formData.images.length > 0 && (
                                        <div className="grid grid-cols-5 gap-4 mt-6">
                                            {formData.images.map((url, index) => (
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
                                                        ×
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-gray-50 flex justify-end gap-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => navigate('/seller/products')}
                                disabled={saving}
                                className="rounded-xl px-6"
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                variant="wine"
                                disabled={saving}
                                className="rounded-xl px-8 shadow-wine transition-all hover:scale-105 active:scale-95"
                            >
                                {saving ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Salvando...
                                    </>
                                ) : (
                                    id ? 'Salvar Alterações' : 'Publicar Anúncio'
                                )}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}

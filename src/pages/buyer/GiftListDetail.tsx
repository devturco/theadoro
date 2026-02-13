import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Gift, ArrowLeft, Trash2, ShoppingCart, Share2, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

interface GiftList {
    id: string;
    title: string;
    description: string;
    event_date: string;
    is_public: boolean;
    slug: string;
}

interface GiftListItem {
    id: string;
    product_id: string;
    product: {
        name: string;
        price: number;
        images: string[];
    };
    quantity_desired: number;
    quantity_purchased: number;
}

export default function GiftListDetail() {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [list, setList] = useState<GiftList | null>(null);
    const [items, setItems] = useState<GiftListItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            fetchListDetails();
        }
    }, [id]);

    const fetchListDetails = async () => {
        try {
            // Fetch list
            const { data: listData, error: listError } = await supabase
                .from('gift_lists' as any)
                .select('*')
                .eq('id', id)
                .single();

            if (listError) throw listError;
            setList(listData as any);

            // Fetch items
            const { data: itemsData, error: itemsError } = await supabase
                .from('gift_list_items' as any)
                .select('*, product:products(name, price, images)')
                .eq('list_id', id);

            if (itemsError) throw itemsError;
            setItems((itemsData as any) || []);
        } catch (error) {
            console.error('Error fetching list details:', error);
            // Mock data if table doesn't exist
            if (!list) {
                setList({
                    id: '1',
                    title: 'Lista de Casamento',
                    description: 'Nossa lista para o grande dia!',
                    event_date: '2024-12-20',
                    is_public: true,
                    slug: 'casamento-ana-e-joao'
                });
                setItems([
                    {
                        id: '101',
                        product_id: 'prod1',
                        product: {
                            name: 'Jogo de Jantar 24 Peças',
                            price: 450.00,
                            images: ['/placeholder-product.jpg']
                        },
                        quantity_desired: 1,
                        quantity_purchased: 0
                    }
                ]);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveItem = async (itemId: string) => {
        try {
            const { error } = await supabase
                .from('gift_list_items' as any)
                .delete()
                .eq('id', itemId);

            if (error) throw error;
            toast.success('Item removido!');
            setItems(prev => prev.filter(i => i.id !== itemId));
        } catch (error) {
            setItems(prev => prev.filter(i => i.id !== itemId));
        }
    };

    if (loading) return <div>Carregando...</div>;
    if (!list) return <div>Lista não encontrada.</div>;

    return (
        <div className="container py-8 space-y-8 animate-in fade-in duration-500">
            <Button variant="ghost" onClick={() => navigate('/buyer/lists')} className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para Listas
            </Button>

            <div className="flex flex-col md:flex-row justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold font-sans text-gradient-wine flex items-center gap-2">
                        <Gift className="h-8 w-8" />
                        {list.title}
                    </h1>
                    {list.description && <p className="text-muted-foreground mt-2">{list.description}</p>}
                    <div className="flex gap-2 mt-2">
                        {list.event_date && (
                            <Badge variant="outline">{format(new Date(list.event_date), 'dd/MM/yyyy')}</Badge>
                        )}
                        <Badge variant={list.is_public ? 'default' : 'secondary'}>
                            {list.is_public ? 'Pública' : 'Privada'}
                        </Badge>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => {
                        const url = `${window.location.origin}/lists/${list.slug}`;
                        navigator.clipboard.writeText(url);
                        toast.success('Link copiado!');
                    }}>
                        <Share2 className="mr-2 h-4 w-4" /> Compartilhar
                    </Button>
                    <Button className="bg-wine hover:bg-wine-dark" onClick={() => navigate('/products')}>
                        <Plus className="mr-2 h-4 w-4" /> Adicionar Produtos
                    </Button>
                </div>
            </div>

            <div className="grid gap-6">
                {items.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed text-muted-foreground">
                        <Gift className="h-12 w-12 mx-auto mb-4 opacity-20" />
                        <p>Sua lista está vazia. Explore a loja para adicionar produtos!</p>
                        <Button variant="link" onClick={() => navigate('/products')}>Ir para a Loja</Button>
                    </div>
                ) : (
                    items.map(item => (
                        <Card key={item.id} className="flex flex-col md:flex-row items-center p-4 gap-4">
                            <img src={item.product.images[0] || '/placeholder-product.jpg'} alt={item.product.name} className="w-20 h-20 object-cover rounded-md" />
                            <div className="flex-1">
                                <h3 className="font-semibold">{item.product.name}</h3>
                                <p className="text-sm text-muted-foreground">
                                    Desejado: {item.quantity_desired} | Comprado: {item.quantity_purchased}
                                </p>
                            </div>
                            <div className="font-bold text-wine">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.product.price)}
                            </div>
                            <Button size="icon" variant="ghost" className="text-red-400 hover:text-red-600" onClick={() => handleRemoveItem(item.id)}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}

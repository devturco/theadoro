import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Product } from '@/types/product';
import { ProductGrid } from '@/components/ProductGrid';
import { Loader2 } from 'lucide-react';
import { Button } from '@theadoro/ui';
import { Link } from 'react-router-dom';

const Offers = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchOffers = async () => {
            try {
                setIsLoading(true);
                // Fetch products that have a discount (original_price > price)
                // Note: This logic assumes original_price is populated and greater than price for offers.
                // We might need to filter client side if Supabase query is limited on computed columns.
                const { data, error } = await supabase
                    .from('products')
                    .select('*, slug, seller:profiles(full_name), category:categories(*)')
                    .eq('is_active', true)
                    .not('original_price', 'is', null);

                if (error) throw error;

                // Filter for actual discounts client-side to be safe
                const discountedProducts = (data || [])
                    .map((p: any) => ({
                        ...p,
                        stock_quantity: p.stock_quantity || 0,
                        in_stock: p.in_stock ?? (p.stock_quantity > 0),
                        is_service: p.is_service || false,
                        category: {
                            id: p.category?.id || '',
                            name: p.category?.name || 'Sem Categoria',
                            slug: p.category?.slug || '',
                        },
                        seller: {
                            id: p.seller_id,
                            name: p.seller?.full_name || 'Vendedor'
                        }
                    }))
                    .filter((p: any) => p.original_price > p.price);

                setProducts(discountedProducts);
            } catch (error) {
                console.error('Error fetching offers:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchOffers();
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 pt-32 pb-20">
            <div className="container mx-auto px-4">
                {/* Header */}
                <div className="text-center mb-12 animate-fade-in">
                    <h1 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 mb-4">
                        Ofertas Especiais
                    </h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Aproveite os melhores descontos e oportunidades únicas para presentear quem você ama.
                    </p>
                </div>

                {/* Content */}
                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-wine" />
                    </div>
                ) : products.length > 0 ? (
                    <ProductGrid products={products} loading={false} />
                ) : (
                    <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100 max-w-2xl mx-auto">
                        <div className="mb-6 bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                            <span className="text-3xl">🏷️</span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Nenhuma oferta no momento</h3>
                        <p className="text-gray-500 mb-8">
                            Estamos preparando novas promoções incríveis para você. Confira nossos outros produtos!
                        </p>
                        <Button asChild className="bg-wine hover:bg-wine-dark">
                            <Link to="/products">Ver todos os produtos</Link>
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Offers;

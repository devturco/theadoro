import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, ShoppingBag, Star } from "lucide-react";
import { ProductCard } from "./ProductCard";

import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Product } from '@/types/product';
// ... imports

const FeaturedProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadFeatured = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*, slug, seller:profiles(full_name)')
          .limit(4);

        if (error) throw error;

        setProducts((data || []).map((p: any) => ({
          stock_quantity: p.stock_quantity || 0,
          in_stock: p.in_stock ?? (p.stock_quantity > 0),
          is_service: p.is_service || false,
          is_active: p.is_active !== false,
          tags: p.tags || [],
          category: {
            id: p.category_id,
            name: 'Categoria',
            slug: 'categoria',
          },
          // details
          id: p.id,
          seller_id: p.seller_id,
          name: p.name,
          slug: p.slug,
          price: p.price,
          original_price: p.original_price,
          images: p.images || [],
          rating: 5.0,
          review_count: 0,
          seller: {
            id: p.seller_id,
            name: p.seller?.full_name || 'Vendedor',
          }
        })));
      } catch (error) {
        console.error('Error loading featured products:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadFeatured();
  }, []);

  if (isLoading) return <div className="py-20 text-center">Carregando destaques...</div>;

  return (
    <section className="py-20 bg-cream">
      <div className="container mx-auto px-4">
        {/* ... keeping header ... */}
        <div className="flex justify-between items-center mb-12">
          <div className="animate-fade-in">
            <h2 className="text-4xl font-serif font-bold text-foreground mb-4">
              Produtos em Destaque
            </h2>
            <p className="text-lg text-muted-foreground">
              Selecionados especialmente para você
            </p>
          </div>
          <Button variant="outline" className="hidden md:flex" asChild>
            <Link to="/products">Ver Todos os Produtos</Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              className="animate-fade-in"
            // style={{ animationDelay: `${index * 100}ms` }} // animationDelay logic can be applied if needed in card or wrapper
            />
          ))}
        </div>
        {/* ... footer button ... */}
      </div>
    </section>
  );
};

export default FeaturedProducts;

import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, ShoppingBag, Star } from "lucide-react";

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
            <Link
              to={`/product/${product.slug || product.id}`}
              key={product.id}
              className="group bg-card rounded-2xl overflow-hidden shadow-md hover:shadow-wine transition-all duration-300 animate-fade-in hover-scale block"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Image */}
              <div className="relative aspect-square overflow-hidden bg-muted">
                <img
                  src={product.images[0] || 'https://placehold.co/400'}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                {/* Badge removed as it is not in Product interface generally unless custom field */}
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute top-3 right-3 bg-white/90 hover:bg-white"
                  onClick={(e) => {
                    e.preventDefault();
                    // Add wishlist logic here
                  }}
                >
                  <Heart className="h-4 w-4" />
                </Button>
              </div>

              {/* Content */}
              <div className="p-5 space-y-3">
                {/* Seller */}
                <p className="text-xs text-muted-foreground">{product.seller.name}</p>

                {/* Title */}
                <h3 className="font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                  {product.name}
                </h3>

                {/* Rating */}
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-champagne text-champagne" />
                  <span className="text-sm font-medium">{product.rating}</span>
                  <span className="text-xs text-muted-foreground">({product.review_count})</span>
                </div>

                {/* Price */}
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-primary">
                    R$ {product.price.toFixed(2)}
                  </span>
                  {product.original_price && (
                    <span className="text-sm text-muted-foreground line-through">
                      R$ {product.original_price.toFixed(2)}
                    </span>
                  )}
                </div>

                {/* Actions */}
                <Button
                  variant="wine"
                  className="w-full group-hover:shadow-wine"
                  onClick={(e) => {
                    e.preventDefault();
                    // Add to cart logic here if needed
                  }}
                >
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  Adicionar ao Carrinho
                </Button>
              </div>
            </Link>
          ))}
        </div>
        {/* ... footer button ... */}
      </div>
    </section>
  );
};

export default FeaturedProducts;

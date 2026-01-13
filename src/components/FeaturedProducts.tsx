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
          .select('*, seller:profiles(full_name)')
          .limit(4);

        if (error) throw error;

        setProducts((data || []).map((p: any) => ({
          id: p.id,
          name: p.name,
          price: p.price,
          originalPrice: p.original_price,
          image: p.image_url || 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=2000',
          seller: p.seller?.full_name || 'Vendedor',
          rating: 5.0, // placeholder
          reviews: 0,
          badge: p.is_promotion ? 'Oferta' : undefined,
          description: p.description,
          images: p.images || [],
          reviewCount: 0,
          sellerId: p.seller_id,
          sellerName: p.seller?.full_name || 'Vendedor',
          categoryId: p.category_id,
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
              to={`/products/${product.id}`}
              key={product.id}
              className="group bg-card rounded-2xl overflow-hidden shadow-md hover:shadow-wine transition-all duration-300 animate-fade-in hover-scale block"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Image */}
              <div className="relative aspect-square overflow-hidden bg-muted">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                {product.badge && (
                  <Badge className="absolute top-3 left-3 bg-primary text-primary-foreground">
                    {product.badge}
                  </Badge>
                )}
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
                <p className="text-xs text-muted-foreground">{product.sellerName}</p>

                {/* Title */}
                <h3 className="font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                  {product.name}
                </h3>

                {/* Rating */}
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-champagne text-champagne" />
                  <span className="text-sm font-medium">{product.rating}</span>
                  <span className="text-xs text-muted-foreground">({product.reviews})</span>
                </div>

                {/* Price */}
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-primary">
                    R$ {product.price.toFixed(2)}
                  </span>
                  {product.originalPrice && (
                    <span className="text-sm text-muted-foreground line-through">
                      R$ {product.originalPrice.toFixed(2)}
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

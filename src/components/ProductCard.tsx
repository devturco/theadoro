import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Star, ShoppingBag, MapPin } from 'lucide-react';
import { Product } from '@/types/product';
import { useWishlist } from '@/hooks/useWishlist';
import { useCart } from '@/hooks/useCart';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  product: Product;
  className?: string;
  showQuickAdd?: boolean;
  showWishlist?: boolean;
  variant?: 'default' | 'compact' | 'featured';
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  className,
  showQuickAdd = true,
  showWishlist = true,
  variant = 'default',
}) => {
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();
  const [isAdding, setIsAdding] = React.useState(false);

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);
  };

  const handleQuickAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsAdding(true);
    // Simulate a small delay for feedback or just add
    addToCart(product, 1);
    setTimeout(() => setIsAdding(false), 500);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  const hasDiscount = product.original_price && product.original_price > product.price;
  const discountPercentage = hasDiscount
    ? Math.round(((product.original_price! - product.price) / product.original_price!) * 100)
    : 0;

  return (
    <div
      className={cn(
        'group relative bg-white rounded-lg overflow-hidden transition-all duration-300 hover:shadow-xl flex flex-col h-fit border border-transparent hover:border-gray-100',
        className
      )}
    >
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-white">
        <Link to={`/product/${product.slug || product.id}`} className="block w-full h-full">
          <img
            src={product.images[0] || '/placeholder-product.jpg'}
            alt={product.name}
            className="w-full h-full object-contain p-2 transition-transform duration-500 group-hover:scale-105"
          />
        </Link>

        {/* Badges - Removed absolute badges for ML style, favor inline text next to price or distinct tags */}
        {/* ML often has no overlay badges on the image except maybe 'FULL' lightning bolt or free shipping strip, 
            but the user print shows discount next to price. keeping image clean. */}
        <div className="absolute top-0 right-0 p-2">
          {/* Keeping Wishlist here? ML puts it top right often */}
        </div>

        {/* Wishlist Button */}
        {showWishlist && (
          <button
            className="absolute top-3 right-3 p-2 rounded-full bg-white/90 backdrop-blur text-gray-400 hover:text-red-500 hover:bg-white transition-all shadow-sm border border-transparent hover:border-gray-100 z-10"
            onClick={handleWishlistClick}
          >
            <Heart
              className={cn(
                'h-4 w-4 transition-colors',
                isInWishlist(product.id) && 'fill-current text-red-500'
              )}
            />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-3 flex flex-col gap-2">
        <Link to={`/product/${product.slug || product.id}`} className="block group/title">
          {/* Title - Clean, gray, simplified */}
          <h3 className="text-sm font-normal text-gray-600 line-clamp-2 leading-snug group-hover/title:text-gray-900 transition-colors">
            {product.name}
          </h3>
        </Link>

        {/* Price Block */}
        <div className="mt-1">
          {/* Original Price */}
          {hasDiscount && (
            <span className="text-xs text-gray-400 line-through block">
              {formatPrice(product.original_price!)}
            </span>
          )}

          {/* Current Price and Discount */}
          <div className="flex items-center gap-2">
            <span className="text-2xl font-normal text-gray-900">
              {formatPrice(product.price)}
            </span>
            {hasDiscount && (
              <span className="text-sm font-medium text-green-600">
                {discountPercentage}% OFF
              </span>
            )}
          </div>

          {/* Installments Logic (Simulated 10x or 12x) */}
          <div className="text-[10px] sm:text-xs text-gray-900 mt-1">
            em <span className="font-medium">10x {formatPrice(product.price / 10)}</span> sem juros
          </div>

          {/* Free Shipping Badge */}
          {product.price > 79 && ( // Simulation: Free shipping over R$ 79
            <div className="mt-2 text-center">
              <span className="text-xs font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded inline-block">
                Entrega Full
              </span>
            </div>
          )}

          {/* Rating (Optional vs ML style, keeping simplistic) */}
          {product.rating > 0 && (
            <div className="flex items-center gap-0.5 mt-2">
              {/* Only showing star count or simplistic stars if space permits, 
                     ML usually puts this lower or hides in grid if not minimal */}
              {/* Keeping hidden for strict ML clone or showing small? 
                    User asked to be "Equal", grid listings often don't show stars prominently unless "Best Seller".
                    I'll keep it very subtle or remove if strictly following "clean".
                    Let's keep it but very specific.
                */}
            </div>
          )}
        </div>

        <div className="mt-2">
          {/* Quick Add Button - Kept as requested but styled to fit */}
          {showQuickAdd && product.in_stock && (
            <Button
              size="sm"
              className={cn(
                "w-full rounded-md transition-all h-8 bg-wine hover:bg-wine-dark text-white font-medium text-xs shadow-none"
              )}
              onClick={handleQuickAdd}
              disabled={isAdding}
            >
              {isAdding ? (
                <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                "Adicionar ao carrinho"
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
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
  const { addItem } = useCart();

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);
  };

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product, 1);
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

  const cardClasses = cn(
    'group relative bg-white rounded-lg border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-gray-300',
    {
      'h-96': variant === 'default',
      'h-80': variant === 'compact',
      'h-[420px]': variant === 'featured',
    },
    className
  );

  const imageClasses = cn(
    'w-full object-cover transition-transform duration-300 group-hover:scale-105',
    {
      'h-48': variant === 'default',
      'h-40': variant === 'compact',
      'h-56': variant === 'featured',
    }
  );

  return (
    <Link to={`/products/${product.id}`} className={cardClasses}>
      {/* Image Container */}
      <div className="relative overflow-hidden">
        <img
          src={product.images[0] || '/placeholder-product.jpg'}
          alt={product.name}
          className={imageClasses}
        />
        
        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {hasDiscount && (
            <Badge variant="destructive" className="text-xs">
              -{discountPercentage}%
            </Badge>
          )}
          {product.is_service && (
            <Badge variant="secondary" className="text-xs">
              Serviço
            </Badge>
          )}
          {!product.in_stock && (
            <Badge variant="outline" className="text-xs bg-gray-100">
              Esgotado
            </Badge>
          )}
        </div>

        {/* Wishlist Button */}
        {showWishlist && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2 p-2 bg-white/80 hover:bg-white transition-colors"
            onClick={handleWishlistClick}
          >
            <Heart
              className={cn(
                'h-4 w-4 transition-colors',
                isInWishlist(product.id)
                  ? 'fill-red-500 text-red-500'
                  : 'text-gray-600 hover:text-red-500'
              )}
            />
          </Button>
        )}

        {/* Quick Add Button */}
        {showQuickAdd && product.in_stock && (
          <Button
            size="sm"
            className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleQuickAdd}
          >
            <ShoppingBag className="h-4 w-4 mr-1" />
            Adicionar
          </Button>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col justify-between flex-1">
        <div>
          {/* Category */}
          <p className="text-xs text-gray-500 mb-1">{product.category.name}</p>
          
          {/* Title */}
          <h3 className="font-medium text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
            {product.name}
          </h3>

          {/* Seller Info */}
          <div className="flex items-center gap-1 mb-2">
            <MapPin className="h-3 w-3 text-gray-400" />
            <span className="text-xs text-gray-500">{product.seller.location}</span>
          </div>

          {/* Rating */}
          {product.rating > 0 && (
            <div className="flex items-center gap-1 mb-2">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm text-gray-600">
                {product.rating.toFixed(1)}
              </span>
              <span className="text-xs text-gray-500">
                ({product.review_count})
              </span>
            </div>
          )}
        </div>

        {/* Price */}
        <div className="mt-auto">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-gray-900">
              {formatPrice(product.price)}
            </span>
            {hasDiscount && (
              <span className="text-sm text-gray-500 line-through">
                {formatPrice(product.original_price!)}
              </span>
            )}
          </div>
          
          {product.is_service && (
            <p className="text-xs text-gray-500 mt-1">
              A partir de
            </p>
          )}
        </div>
      </div>
    </Link>
  );
};
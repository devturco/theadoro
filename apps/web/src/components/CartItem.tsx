import React, { useState } from 'react';
import { Minus, Plus, Trash2, Heart, ExternalLink } from 'lucide-react';
import { CartItem as CartItemType } from '@/contexts/CartContext';
import { Button } from '@theadoro/ui';
import { Badge } from '@theadoro/ui';
import { useCart } from '@/hooks/useCart';
import { useWishlist } from '@/hooks/useWishlist';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

interface CartItemProps {
  item: CartItemType;
  showActions?: boolean;
  compact?: boolean;
  className?: string;
}

export const CartItem: React.FC<CartItemProps> = ({
  item,
  showActions = true,
  compact = false,
  className,
}) => {
  const { updateQuantity, removeFromCart } = useCart();
  const { addToWishlist, isInWishlist } = useWishlist();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleQuantityChange = async (newQuantity: number) => {
    if (newQuantity < 1) return;

    setIsUpdating(true);
    try {
      await updateQuantity(item.id, newQuantity);
    } catch (error) {
      console.error('Error updating quantity:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemove = async () => {
    try {
      await removeFromCart(item.id);
    } catch (error) {
      console.error('Error removing item:', error);
    }
  };

  const handleMoveToWishlist = async () => {
    try {
      await addToWishlist({
        ...item.product, // Spread existing product properties first
        id: item.product.id,
        name: item.product.name,
        slug: item.product.slug,
        price: item.product.price,
        images: item.product.images || [], // Ensure images is passed correctly
        seller: item.product.seller,
      });
      await removeFromCart(item.id);
    } catch (error) {
      console.error('Error moving to wishlist:', error);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  const totalPrice = item.product.price * item.quantity;
  const hasDiscount = item.product.original_price && item.product.original_price > item.product.price;
  const discountPercentage = hasDiscount
    ? Math.round(((item.product.original_price! - item.product.price) / item.product.original_price!) * 100)
    : 0;

  const itemClasses = cn(
    'bg-white border border-gray-200 rounded-xl p-3 sm:p-4',
    compact && 'p-2',
    className
  );

  return (
    <div className={itemClasses}>
      <div className={cn('flex gap-3 sm:gap-4', compact && 'gap-2')}>
        {/* Product Image */}
        <div className={cn('flex-shrink-0', compact ? 'w-14 h-14' : 'w-16 h-16 sm:w-20 sm:h-20')}>
          <img
            src={item.product.images?.[0] || '/placeholder-product.jpg'}
            alt={item.product.name}
            className="w-full h-full object-cover rounded-lg sm:rounded-md"
          />
        </div>

        {/* Product Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <Link
                to={`/product/${item.product.slug || item.product.id}`}
                className="text-xs sm:text-sm font-semibold text-gray-900 hover:text-wine line-clamp-2 leading-tight"
              >
                {item.product.name}
              </Link>

              {item.product.seller && !compact && (
                <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5">
                  Vendido por {item.product.seller.name || item.product.seller.full_name}
                </p>
              )}

              {/* Variant Info */}
              {item.selectedOptions && Object.keys(item.selectedOptions).length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {Object.entries(item.selectedOptions).map(([key, value]) => (
                    <Badge key={key} variant="outline" className="text-[9px] sm:text-xs h-4 sm:h-5">
                      {value}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            {!compact && (
              <div className="flex items-center gap-0.5 ml-2">
                <Link to={`/product/${item.product.slug || item.product.id}`}>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 sm:h-8 sm:w-8">
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </Link>

                {showActions && !isInWishlist(item.product.id) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleMoveToWishlist}
                    className="h-7 w-7 p-0 sm:h-8 sm:w-8"
                    title="Mover para lista de desejos"
                  >
                    <Heart className="h-3 w-3" />
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Price and Quantity */}
          <div className="flex flex-wrap items-center justify-between mt-2 gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs sm:text-sm font-bold text-gray-900">
                {formatPrice(item.product.price || 0)}
              </span>

              {hasDiscount && !compact && (
                <span className="text-[10px] text-gray-400 line-through">
                  {formatPrice(item.product.original_price!)}
                </span>
              )}
            </div>

            {/* Quantity Controls */}
            {showActions && (
              <div className="flex items-center gap-1.5 sm:gap-2 ml-auto">
                <div className="flex items-center border border-gray-200 rounded-lg bg-gray-50/50">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleQuantityChange(item.quantity - 1)}
                    disabled={item.quantity <= 1 || isUpdating}
                    className="h-7 w-7 p-0 rounded-none hover:bg-transparent"
                  >
                    <Minus className="h-3 w-3" />
                  </Button>

                  <span className="px-1 text-xs font-bold min-w-[1.5rem] text-center">
                    {item.quantity}
                  </span>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleQuantityChange(item.quantity + 1)}
                    disabled={item.quantity >= (item.product.stock_quantity || 99) || isUpdating}
                    className="h-7 w-7 p-0 rounded-none hover:bg-transparent"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRemove}
                  className="h-7 w-7 p-0 text-red-400 hover:text-red-600 hover:bg-red-50"
                  title="Remover item"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>

          {/* Total Price - Hidden on very small mobile if compact */}
          {item.quantity > 1 && !compact && (
            <div className="hidden sm:flex justify-between items-center mt-2 pt-2 border-t border-gray-50">
              <span className="text-[10px] text-gray-400 uppercase tracking-tight font-bold">Subtotal</span>
              <span className="text-xs sm:text-sm font-bold text-gray-900">
                {formatPrice(totalPrice)}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
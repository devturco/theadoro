import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, ArrowLeft, Trash2, Heart, Plus, Minus } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { useWishlist } from '@/hooks/useWishlist';
import { CartItem } from '@/components/CartItem';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

export const Cart: React.FC = () => {
  const navigate = useNavigate();
  const { 
    cart, 
    loading, 
    updateQuantity, 
    removeFromCart, 
    clearCart,
    getCartSummary 
  } = useCart();
  
  const [isClearing, setIsClearing] = useState(false);
  const [processingItems, setProcessingItems] = useState<Set<string>>(new Set());

  const summary = getCartSummary();

  const handleClearCart = async () => {
    if (window.confirm('Tem certeza que deseja remover todos os itens do carrinho?')) {
      setIsClearing(true);
      try {
        await clearCart();
      } catch (error) {
        console.error('Error clearing cart:', error);
      } finally {
        setIsClearing(false);
      }
    }
  };

  const handleProceedToCheckout = () => {
    if (cart.items.length === 0) return;
    navigate('/checkout');
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  const hasUnavailableItems = cart.items.some(item => 
    item.product.stock === 0 || 
    (item.variant && item.variant.stock === 0)
  );

  const hasLowStockItems = cart.items.some(item => {
    const stock = item.variant?.stock ?? item.product.stock;
    return stock > 0 && stock <= 5;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando carrinho...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => navigate(-1)}
                className="p-2"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <ShoppingBag className="h-6 w-6" />
                  Carrinho de Compras
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  {cart.items.length === 0 
                    ? 'Seu carrinho está vazio' 
                    : `${cart.items.length} ${cart.items.length === 1 ? 'item' : 'itens'} no carrinho`
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {cart.items.length === 0 ? (
          /* Empty Cart */
          <div className="text-center py-16">
            <ShoppingBag className="h-24 w-24 text-gray-300 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Seu carrinho está vazio
            </h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Que tal explorar nossos produtos e encontrar algo especial?
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg">
                <Link to="/products">
                  Explorar Produtos
                </Link>
              </Button>
              <Button variant="outline" asChild size="lg">
                <Link to="/categories">
                  Ver Categorias
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          /* Cart with Items */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-6">
              {/* Alerts */}
              {hasUnavailableItems && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertDescription className="text-red-800">
                    Alguns itens em seu carrinho estão fora de estoque e não poderão ser comprados.
                  </AlertDescription>
                </Alert>
              )}

              {hasLowStockItems && (
                <Alert className="border-orange-200 bg-orange-50">
                  <AlertDescription className="text-orange-800">
                    Alguns itens têm estoque limitado. Finalize sua compra logo para garantir!
                  </AlertDescription>
                </Alert>
              )}

              {/* Cart Header */}
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Itens no Carrinho ({cart.items.length})
                  </h2>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearCart}
                    disabled={isClearing}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {isClearing ? 'Limpando...' : 'Limpar carrinho'}
                  </Button>
                </div>
              </div>

              {/* Cart Items List */}
              <div className="space-y-4">
                {cart.items.map((item) => (
                  <CartItem
                    key={item.id}
                    item={item}
                    showActions={true}
                    className="shadow-sm"
                  />
                ))}
              </div>

              {/* Continue Shopping */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="text-center">
                  <p className="text-gray-600 mb-4">
                    Quer adicionar mais itens ao seu carrinho?
                  </p>
                  <Button variant="outline" asChild>
                    <Link to="/products">
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Continuar Comprando
                    </Link>
                  </Button>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="sticky top-6">
                <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Resumo do Pedido
                  </h3>

                  {/* Summary Details */}
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        Subtotal ({summary.itemCount} {summary.itemCount === 1 ? 'item' : 'itens'})
                      </span>
                      <span className="font-medium text-gray-900">
                        {formatPrice(summary.subtotal)}
                      </span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Frete</span>
                      <span className={cn(
                        'font-medium',
                        summary.shipping === 0 ? 'text-green-600' : 'text-gray-900'
                      )}>
                        {summary.shipping === 0 ? 'Grátis' : formatPrice(summary.shipping)}
                      </span>
                    </div>

                    {summary.tax > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Impostos</span>
                        <span className="font-medium text-gray-900">
                          {formatPrice(summary.tax)}
                        </span>
                      </div>
                    )}

                    {summary.discount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Desconto</span>
                        <span className="font-medium text-green-600">
                          -{formatPrice(summary.discount)}
                        </span>
                      </div>
                    )}

                    <Separator />

                    <div className="flex justify-between">
                      <span className="text-lg font-semibold text-gray-900">Total</span>
                      <span className="text-lg font-bold text-gray-900">
                        {formatPrice(summary.total)}
                      </span>
                    </div>
                  </div>

                  {/* Shipping Info */}
                  {summary.shipping === 0 && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <p className="text-sm text-green-800 font-medium">
                        🎉 Você ganhou frete grátis!
                      </p>
                    </div>
                  )}

                  {/* Checkout Button */}
                  <Button
                    onClick={handleProceedToCheckout}
                    disabled={hasUnavailableItems}
                    className="w-full"
                    size="lg"
                  >
                    Finalizar Compra
                  </Button>

                  {hasUnavailableItems && (
                    <p className="text-xs text-red-600 text-center">
                      Remova os itens indisponíveis para continuar
                    </p>
                  )}

                  {/* Security Info */}
                  <div className="text-center space-y-2">
                    <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                      <span>🔒</span>
                      <span>Compra 100% segura e protegida</span>
                    </div>
                    
                    <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                      <span>↩️</span>
                      <span>7 dias para devolução</span>
                    </div>
                  </div>

                  {/* Payment Methods */}
                  <div className="border-t border-gray-200 pt-4">
                    <p className="text-xs text-gray-600 text-center mb-2">
                      Formas de pagamento aceitas:
                    </p>
                    <div className="flex justify-center gap-2">
                      <Badge variant="outline" className="text-xs">Cartão</Badge>
                      <Badge variant="outline" className="text-xs">PIX</Badge>
                      <Badge variant="outline" className="text-xs">Boleto</Badge>
                    </div>
                  </div>
                </div>

                {/* Recommended Products */}
                <div className="mt-6 bg-white rounded-lg border border-gray-200 p-6">
                  <h4 className="font-medium text-gray-900 mb-4">
                    Você também pode gostar
                  </h4>
                  
                  <div className="space-y-3">
                    {/* This would be populated with recommended products */}
                    <div className="text-center text-sm text-gray-500 py-4">
                      Carregando recomendações...
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;
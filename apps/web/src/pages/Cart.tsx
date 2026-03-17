import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, ArrowLeft, Trash2, Heart, Plus, Minus, Truck, MapPin } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { useWishlist } from '@/hooks/useWishlist';
import { useShipping } from '@/hooks/useShipping';
import { CartItem } from '@/components/CartItem';
import { Button } from '@theadoro/ui';
import { Input } from '@theadoro/ui';
import { Separator } from '@theadoro/ui';
import { Badge } from '@theadoro/ui';
import { Alert, AlertDescription } from '@theadoro/ui';
import { cn } from '@/lib/utils';

export const Cart: React.FC = () => {
  const navigate = useNavigate();
  const {
    cart,
    updateQuantity,
    removeFromCart,
    clearCart,
    setShipping,
  } = useCart();

  const [isClearing, setIsClearing] = useState(false);
  const [processingItems, setProcessingItems] = useState<Set<string>>(new Set());

  // Shipping Logic
  const [cep, setCep] = useState('');
  const { calculateShipping, options: shippingOptions, loading: loadingShipping } = useShipping();

  const handleCalculateShipping = () => {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length < 8) return;

    // Create shipping items from cart items
    const shippingItems = cart.items.map(item => ({
      weight: 1, // Default 1kg for now, ideally comes from product
      width: 20,
      height: 20,
      length: 20,
      quantity: item.quantity,
      price: item.product.price
    }));

    const sellerId = cart.items[0]?.product.seller_id;
    calculateShipping(cleanCep, shippingItems, sellerId);
  };

  const handleSelectShipping = (option: any) => {
    if (option.deliveryTime === -1) return;
    setShipping({
      id: option.id,
      name: option.name,
      price: option.price,
      deliveryTime: option.deliveryTime
    });
  };

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
    (item.product.stock_quantity || 0) === 0
  );

  const hasLowStockItems = cart.items.some(item => {
    const stock = item.product.stock_quantity || 0;
    return stock > 0 && stock <= 5;
  });

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
                        Subtotal ({cart.items.length} {cart.items.length === 1 ? 'item' : 'itens'})
                      </span>
                      <span className="font-medium text-gray-900">
                        {formatPrice(cart.subtotal)}
                      </span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Frete</span>
                      <span className={cn(
                        'font-medium',
                        cart.shipping === 0 ? 'text-green-600' : 'text-gray-900'
                      )}>
                        {cart.shipping === 0 ? 'Grátis' : formatPrice(cart.shipping)}
                      </span>
                    </div>

                    {cart.discount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Desconto</span>
                        <span className="font-medium text-green-600">
                          -{formatPrice(cart.discount)}
                        </span>
                      </div>
                    )}

                    <Separator />

                    {/* Shipping Calculator */}
                    <div className="border-t border-gray-200 pt-4 pb-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Truck className="h-4 w-4 text-gray-600" />
                        <span className="font-medium text-sm text-gray-900">Estimar Frete</span>
                      </div>

                      <div className="flex gap-2 mb-3">
                        <Input
                          placeholder="CEP"
                          value={cep}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '').slice(0, 8);
                            setCep(val.replace(/(\d{5})(\d)/, '$1-$2'));
                          }}
                          maxLength={9}
                          className="h-9 bg-white"
                        />
                        <Button
                          onClick={handleCalculateShipping}
                          disabled={loadingShipping || cep.length < 9}
                          variant="secondary"
                          size="sm"
                        >
                          {loadingShipping ? '...' : 'OK'}
                        </Button>
                      </div>

                      {shippingOptions.length > 0 && (
                        <div className="space-y-2">
                          {shippingOptions.map((option) => (
                            <div 
                              key={option.id} 
                              onClick={() => handleSelectShipping(option)}
                              className={cn(
                                "flex justify-between items-center text-sm p-3 rounded border transition-all cursor-pointer",
                                option.deliveryTime === -1 ? "bg-red-50 border-red-100 text-red-700 cursor-not-allowed" : 
                                cart.selectedShipping?.id === option.id ? "bg-wine/5 border-wine ring-1 ring-wine/20 shadow-sm" :
                                "bg-gray-50 border-gray-100 hover:border-gray-300"
                              )}
                            >
                              <div className="flex-1">
                                <div className="flex flex-col gap-0.5">
                                  <div className="flex items-center gap-1.5">
                                    <span className={cn("font-medium", option.deliveryTime === -1 ? "text-red-800" : "text-gray-700")}>
                                      {option.name.split('(')[0].trim()}
                                    </span>
                                    {option.deliveryTime === 0 && (
                                      <Badge className="bg-wine hover:bg-wine-dark text-[10px] px-1 h-4 shrink-0">
                                        ⚡ EXPRESS
                                      </Badge>
                                    )}
                                  </div>
                                  {option.deliveryTime === -1 ? (
                                    <span className="text-[10px] text-red-600 mt-0.5">{option.error}</span>
                                  ) : (
                                    <>
                                      {option.name.includes('(') && (
                                        <span className="text-[10px] text-gray-400 leading-none italic">
                                          ({option.name.split('(')[1]}
                                        </span>
                                      )}
                                      <span className="text-[10px] text-gray-500 mt-1 block">
                                        {option.deliveryTime === 0 ? 'Chega em até 90 min!' : `${option.deliveryTime} dias úteis`}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                              {option.deliveryTime !== -1 && (
                                <span className={cn("font-medium ml-2", option.price === 0 ? "text-green-600" : "text-gray-900")}>
                                  {option.price === 0 ? 'Grátis' : formatPrice(option.price)}
                                </span>
                              )}
                            </div>
                          ))}
                          {shippingOptions.some(o => o.deliveryTime !== -1) && (
                            <div className="flex items-center text-[10px] text-blue-600 mt-1 pl-1">
                              <MapPin className="h-3 w-3 mr-1" />
                              Entrega via Uber Direct disponível
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between">
                      <span className="text-lg font-semibold text-gray-900">Total</span>
                      <span className="text-lg font-bold text-gray-900">
                        {formatPrice(cart.total)}
                      </span>
                    </div>
                  </div>

                  {/* Shipping Info */}
                  {cart.shipping === 0 && (
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
                    </div>
                  </div>
                </div>

                {/* Recommended Products */}
                {/* Recommended Products - TODO: Implement recommendation logic
                <div className="mt-6 bg-white rounded-lg border border-gray-200 p-6">
                  <h4 className="font-medium text-gray-900 mb-4">
                    Você também pode gostar
                  </h4>

                  <div className="space-y-3">
                    <div className="text-center text-sm text-gray-500 py-4">
                      Carregando recomendações...
                    </div>
                  </div>
                </div>
                */}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;
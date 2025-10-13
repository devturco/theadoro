import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Heart, 
  Share2, 
  ShoppingCart, 
  Star, 
  Truck, 
  Shield, 
  RotateCcw, 
  ChevronLeft,
  ChevronRight,
  Plus,
  Minus,
  MapPin,
  Store,
  MessageCircle,
  ThumbsUp
} from 'lucide-react';
import { useProduct } from '@/hooks/useProduct';
import { useCart } from '@/hooks/useCart';
import { useWishlist } from '@/hooks/useWishlist';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ProductGrid } from '@/components/ProductGrid';
import { cn } from '@/lib/utils';

export const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  const {
    product,
    relatedProducts,
    reviews,
    loading,
    error,
    addReview,
    markReviewHelpful,
  } = useProduct(id!);

  useEffect(() => {
    if (product && product.variants && product.variants.length > 0) {
      setSelectedVariant(product.variants[0].id);
    }
  }, [product]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando produto...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Produto não encontrado</h2>
          <p className="text-gray-600 mb-4">O produto que você está procurando não existe ou foi removido.</p>
          <Button onClick={() => navigate('/products')}>
            Voltar aos produtos
          </Button>
        </div>
      </div>
    );
  }

  const handleAddToCart = async () => {
    setIsAddingToCart(true);
    try {
      await addToCart({
        productId: product.id,
        quantity,
        variantId: selectedVariant || undefined,
      });
    } catch (error) {
      console.error('Error adding to cart:', error);
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleWishlistToggle = async () => {
    try {
      if (isInWishlist(product.id)) {
        await removeFromWishlist(product.id);
      } else {
        await addToWishlist({
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.images[0]?.url || '',
          seller: product.seller,
        });
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  const hasDiscount = product.originalPrice && product.originalPrice > product.price;
  const discountPercentage = hasDiscount 
    ? Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100)
    : 0;

  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
    : 0;

  const selectedVariantData = product.variants?.find(v => v.id === selectedVariant);
  const currentStock = selectedVariantData?.stock ?? product.stock;
  const maxQuantity = Math.min(currentStock, 10);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center space-x-2 text-sm text-gray-600">
            <Link to="/" className="hover:text-blue-600">Início</Link>
            <span>/</span>
            <Link to="/products" className="hover:text-blue-600">Produtos</Link>
            <span>/</span>
            <span className="text-gray-900 truncate">{product.name}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Product Images */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="aspect-square bg-white rounded-lg border border-gray-200 overflow-hidden">
              <img
                src={product.images[selectedImageIndex]?.url || '/placeholder-product.jpg'}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Thumbnail Images */}
            {product.images.length > 1 && (
              <div className="flex space-x-2 overflow-x-auto">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={cn(
                      'flex-shrink-0 w-20 h-20 rounded-lg border-2 overflow-hidden',
                      selectedImageIndex === index 
                        ? 'border-blue-600' 
                        : 'border-gray-200 hover:border-gray-300'
                    )}
                  >
                    <img
                      src={image.url}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Header */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {product.name}
              </h1>
              
              {/* Rating */}
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        'h-5 w-5',
                        i < Math.floor(averageRating) 
                          ? 'text-yellow-400 fill-current' 
                          : 'text-gray-300'
                      )}
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-600">
                  {averageRating.toFixed(1)} ({reviews.length} avaliações)
                </span>
              </div>

              {/* Seller */}
              {product.seller && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Store className="h-4 w-4" />
                  <span>Vendido por</span>
                  <Link 
                    to={`/sellers/${product.seller.id}`}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    {product.seller.name}
                  </Link>
                  {product.seller.location && (
                    <>
                      <span>•</span>
                      <MapPin className="h-3 w-3" />
                      <span>{product.seller.location}</span>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Price */}
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="text-3xl font-bold text-gray-900">
                  {formatPrice(product.price)}
                </span>
                
                {hasDiscount && (
                  <>
                    <span className="text-lg text-gray-500 line-through">
                      {formatPrice(product.originalPrice!)}
                    </span>
                    <Badge variant="destructive">
                      -{discountPercentage}%
                    </Badge>
                  </>
                )}
              </div>
              
              {product.isService && (
                <Badge variant="outline" className="w-fit">
                  Serviço
                </Badge>
              )}
            </div>

            {/* Variants */}
            {product.variants && product.variants.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-medium text-gray-900">Opções:</h3>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((variant) => (
                    <button
                      key={variant.id}
                      onClick={() => setSelectedVariant(variant.id)}
                      className={cn(
                        'px-4 py-2 border rounded-lg text-sm font-medium transition-colors',
                        selectedVariant === variant.id
                          ? 'border-blue-600 bg-blue-50 text-blue-700'
                          : 'border-gray-300 hover:border-gray-400'
                      )}
                    >
                      {variant.color && variant.size 
                        ? `${variant.color} - ${variant.size}`
                        : variant.color || variant.size || variant.name
                      }
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="space-y-3">
              <h3 className="font-medium text-gray-900">Quantidade:</h3>
              <div className="flex items-center gap-4">
                <div className="flex items-center border border-gray-300 rounded-lg">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    className="h-10 w-10 p-0 rounded-none"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  
                  <span className="px-4 py-2 text-center min-w-[3rem] font-medium">
                    {quantity}
                  </span>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
                    disabled={quantity >= maxQuantity}
                    className="h-10 w-10 p-0 rounded-none"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                
                <span className="text-sm text-gray-600">
                  {currentStock > 0 ? `${currentStock} disponíveis` : 'Fora de estoque'}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <div className="flex gap-3">
                <Button
                  onClick={handleAddToCart}
                  disabled={currentStock === 0 || isAddingToCart}
                  className="flex-1"
                  size="lg"
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  {isAddingToCart ? 'Adicionando...' : 'Adicionar ao Carrinho'}
                </Button>
                
                <Button
                  variant="outline"
                  onClick={handleWishlistToggle}
                  size="lg"
                  className="px-4"
                >
                  <Heart 
                    className={cn(
                      'h-5 w-5',
                      isInWishlist(product.id) && 'fill-current text-red-500'
                    )} 
                  />
                </Button>
                
                <Button variant="outline" size="lg" className="px-4">
                  <Share2 className="h-5 w-5" />
                </Button>
              </div>
              
              {currentStock <= 5 && currentStock > 0 && (
                <p className="text-sm text-orange-600">
                  ⚠️ Apenas {currentStock} unidades restantes!
                </p>
              )}
            </div>

            {/* Shipping Info */}
            {product.shippingInfo && (
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Truck className="h-5 w-5 text-gray-600" />
                  <span className="font-medium text-gray-900">Entrega</span>
                </div>
                
                <div className="space-y-1 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Frete:</span>
                    <span className={product.shippingInfo.freeShipping ? 'text-green-600 font-medium' : ''}>
                      {product.shippingInfo.freeShipping ? 'Grátis' : formatPrice(product.shippingInfo.price)}
                    </span>
                  </div>
                  
                  {product.shippingInfo.estimatedDays && (
                    <div className="flex justify-between">
                      <span>Prazo:</span>
                      <span>{product.shippingInfo.estimatedDays} dias úteis</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Guarantees */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Shield className="h-4 w-4" />
                <span>Compra protegida</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <RotateCcw className="h-4 w-4" />
                <span>7 dias para devolução</span>
              </div>
            </div>
          </div>
        </div>

        {/* Product Details Tabs */}
        <Tabs defaultValue="description" className="mb-12">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="description">Descrição</TabsTrigger>
            <TabsTrigger value="reviews">Avaliações ({reviews.length})</TabsTrigger>
            <TabsTrigger value="seller">Vendedor</TabsTrigger>
          </TabsList>
          
          <TabsContent value="description" className="mt-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="prose max-w-none">
                <p className="text-gray-700 leading-relaxed">
                  {product.description || 'Nenhuma descrição disponível para este produto.'}
                </p>
                
                {product.tags && product.tags.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-medium text-gray-900 mb-3">Tags:</h4>
                    <div className="flex flex-wrap gap-2">
                      {product.tags.map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="reviews" className="mt-6">
            <div className="space-y-6">
              {/* Reviews Summary */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-900">
                      {averageRating.toFixed(1)}
                    </div>
                    <div className="flex items-center justify-center mt-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            'h-4 w-4',
                            i < Math.floor(averageRating) 
                              ? 'text-yellow-400 fill-current' 
                              : 'text-gray-300'
                          )}
                        />
                      ))}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {reviews.length} avaliações
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    {[5, 4, 3, 2, 1].map((rating) => {
                      const count = reviews.filter(r => r.rating === rating).length;
                      const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                      
                      return (
                        <div key={rating} className="flex items-center gap-2 mb-1">
                          <span className="text-sm text-gray-600 w-8">
                            {rating}★
                          </span>
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-yellow-400 h-2 rounded-full"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-600 w-8">
                            {count}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Reviews List */}
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex items-start gap-4">
                      <Avatar>
                        <AvatarImage src={review.user.avatar} />
                        <AvatarFallback>
                          {review.user.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium text-gray-900">
                            {review.user.name}
                          </span>
                          <div className="flex items-center">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={cn(
                                  'h-4 w-4',
                                  i < review.rating 
                                    ? 'text-yellow-400 fill-current' 
                                    : 'text-gray-300'
                                )}
                              />
                            ))}
                          </div>
                          <span className="text-sm text-gray-500">
                            {new Date(review.createdAt).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                        
                        <p className="text-gray-700 mb-3">
                          {review.comment}
                        </p>
                        
                        <div className="flex items-center gap-4">
                          <button 
                            onClick={() => markReviewHelpful(review.id)}
                            className="flex items-center gap-1 text-sm text-gray-600 hover:text-blue-600"
                          >
                            <ThumbsUp className="h-4 w-4" />
                            Útil ({review.helpfulCount || 0})
                          </button>
                          
                          <button className="flex items-center gap-1 text-sm text-gray-600 hover:text-blue-600">
                            <MessageCircle className="h-4 w-4" />
                            Responder
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {reviews.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    Nenhuma avaliação ainda. Seja o primeiro a avaliar!
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="seller" className="mt-6">
            {product.seller && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={product.seller.avatar} />
                    <AvatarFallback>
                      {product.seller.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {product.seller.name}
                    </h3>
                    
                    {product.seller.description && (
                      <p className="text-gray-700 mb-4">
                        {product.seller.description}
                      </p>
                    )}
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      {product.seller.location && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MapPin className="h-4 w-4" />
                          <span>{product.seller.location}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Store className="h-4 w-4" />
                        <span>Membro desde {new Date(product.seller.createdAt).getFullYear()}</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-3">
                      <Button asChild>
                        <Link to={`/sellers/${product.seller.id}`}>
                          Ver perfil completo
                        </Link>
                      </Button>
                      
                      <Button variant="outline">
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Contatar vendedor
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Produtos relacionados
            </h2>
            <ProductGrid
              products={relatedProducts}
              loading={false}
              error={null}
              viewMode="grid"
              showPagination={false}
              className="grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;
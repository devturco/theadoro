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
  ChevronRight,
  Plus,
  Minus,
  Eye,
  CheckCircle,
  Gift,
  ArrowRight
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useProduct } from '@/hooks/useProduct';
import { useCart } from '@/hooks/useCart';
import { useWishlist } from '@/hooks/useWishlist';
import { useShipping } from '@/hooks/useShipping';
import { useAnalytics } from '@/hooks/useAnalytics';
import { Button, Input, Badge, Separator, Avatar, AvatarFallback, AvatarImage, Skeleton, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@theadoro/ui';
import { ProductGrid } from '@/components/ProductGrid';
import { cn } from '@/lib/utils';

export const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { trackEvent } = useAnalytics();

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isGiftListDialogOpen, setIsGiftListDialogOpen] = useState(false);
  const [cep, setCep] = useState('');

  const {
    product,
    relatedProducts,
    reviews,
    loading,
    error,
  } = useProduct(id!);

  // Fetch Total Views
  const { data: totalViews } = useQuery({
    queryKey: ['product-total-views', product?.id],
    queryFn: async () => {
      if (!product?.id) return 0;
      const { count, error } = await supabase
        .from('product_analytics' as any)
        .select('*', { count: 'exact', head: true })
        .eq('product_id', product.id)
        .eq('event_type', 'view');

      if (error) return 0;
      return count || 0;
    },
    enabled: !!product?.id
  });

  // Fetch seller details
  const { data: sellerProfile } = useQuery({
    queryKey: ['seller-profile', product?.seller_id],
    queryFn: async () => {
      if (!product?.seller_id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('max_installments, full_name, avatar_url, verified')
        .eq('id', product.seller_id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!product?.seller_id
  });

  // Gift List Logic
  const { data: userLists } = useQuery({
    queryKey: ['user-gift-lists', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gift_lists' as any)
        .select('*')
        .eq('user_id', user?.id);
      if (error) throw error;
      return data as any[];
    },
    enabled: !!user && isGiftListDialogOpen
  });

  const { calculateShipping, options: shippingOptions, loading: loadingShipping } = useShipping();

  const handleCalculateShipping = () => {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length < 8) return;
    calculateShipping(cleanCep, [{
      weight: 1,
      width: 20,
      height: 20,
      length: 20,
      quantity: quantity,
      price: product?.price || 0
    }], product?.seller_id);
  };

  useEffect(() => {
    // If variants were available in the type, we would set first one. 
    // Since they are not, we skip or handle as dynamic if needed.
    if (product) {
      trackEvent(product.id, product.seller_id, 'view');
    }
  }, [product, trackEvent]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Skeleton className="h-[500px] w-full rounded-3xl" />
          <div className="space-y-6">
            <Skeleton className="h-10 w-3/4 rounded-xl" />
            <Skeleton className="h-6 w-1/2 rounded-xl" />
            <Skeleton className="h-32 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-3xl shadow-sm border border-gray-100 max-w-md mx-6">
          <h2 className="text-2xl font-serif font-bold text-gray-900 mb-2">Produto não encontrado</h2>
          <p className="text-gray-600 mb-6 font-light">O produto que você está procurando não existe ou foi removido.</p>
          <Button onClick={() => navigate('/products')} className="font-medium rounded-full px-8">
            Voltar aos produtos
          </Button>
        </div>
      </div>
    );
  }

  const handleAddToCart = async () => {
    setIsAddingToCart(true);
    try {
      const eventType = product.is_service ? 'appointment_start' : 'click_buy';
      await trackEvent(product.id, product.seller_id, eventType);
      await addToCart(product, quantity, selectedVariant ? { variantId: selectedVariant } : undefined);
    } catch (err) {
      console.error('Error adding to cart:', err);
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleWishlistToggle = async () => {
    if (isInWishlist(product.id)) {
      await removeFromWishlist(product.id);
    } else {
      await addToWishlist(product);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  const maxInstallments = (sellerProfile as any)?.max_installments || 12;
  const currentStock = product.stock_quantity ?? 0;
  const maxQuantity = Math.min(currentStock, 10);

  const handleAddToGiftList = async (listId: string) => {
    try {
      const { error } = await supabase
        .from('gift_list_items' as any)
        .insert({
          list_id: listId,
          product_id: product.id,
          quantity_desired: 1,
          quantity_purchased: 0
        });

      if (error) throw error;
      toast.success('Produto adicionado à sua lista!');
      setIsGiftListDialogOpen(false);
    } catch (err) {
      console.error('Error adding to list:', err);
      toast.error('Erro ao adicionar à lista.');
    }
  };

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : 0;

  const hasDiscount = !!product.price && !!product.original_price && product.original_price > product.price;
  const discountPercentage = hasDiscount
    ? Math.round(((product.original_price! - product.price) / product.original_price!) * 100)
    : 0;

  const images = product.images || ['/placeholder-product.jpg'];

  return (
    <div className="min-h-screen bg-white pb-32 sm:pb-20">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-8">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-xs text-gray-500 mb-6 font-medium">
          <Link to="/" className="hover:text-wine uppercase tracking-widest">Início</Link>
          <ChevronRight className="h-3 w-3 text-gray-300" />
          <Link to="/products" className="hover:text-wine uppercase tracking-widest text-wine">Produtos</Link>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
          {/* LEFT: Images */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white sm:rounded-3xl border border-gray-100 overflow-hidden relative group -mx-3 sm:mx-0">
              {/* Mobile Gallery */}
              <div className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide lg:hidden">
                {images.map((image, index) => (
                  <div key={index} className="flex-shrink-0 w-full aspect-square snap-center flex items-center justify-center bg-gray-50">
                    <img src={image} alt={product.name} className="w-full h-full object-contain mix-blend-multiply" />
                  </div>
                ))}
              </div>

              {/* Desktop Image */}
              <div className="hidden lg:block aspect-square bg-gray-50">
                <img src={images[selectedImageIndex]} alt={product.name} className="w-full h-full object-contain mix-blend-multiply" />
              </div>

              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {product.is_service && <Badge className="bg-white/90 backdrop-blur text-gray-900 border-none shadow-sm font-bold">Serviço</Badge>}
                {hasDiscount && <Badge className="bg-red-500 text-white font-bold">-{discountPercentage}%</Badge>}
              </div>

              {/* Counter Mobile */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 lg:hidden">
                {images.map((_, i) => (
                  <div key={i} className={cn("w-1.5 h-1.5 rounded-full transition-all", selectedImageIndex === i ? "bg-wine w-4" : "bg-gray-300")} />
                ))}
              </div>
            </div>

            {/* Desktop Thumbnails */}
            {images.length > 1 && (
              <div className="hidden lg:flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {images.map((img, idx) => (
                  <button key={idx} onClick={() => setSelectedImageIndex(idx)} className={cn("w-20 h-20 rounded-xl border-2 transition-all", selectedImageIndex === idx ? "border-wine bg-white" : "border-transparent opacity-60 hover:opacity-100")}>
                    <img src={img} className="w-full h-full object-cover rounded-lg" alt="" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT: Info */}
          <div className="lg:col-span-5 space-y-6">
            <div className="space-y-4">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-gray-900 leading-tight">
                {product.name}
              </h1>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-amber-400 fill-current" />
                  <span className="text-sm font-bold text-gray-700">{averageRating.toFixed(1)}</span>
                  <span className="text-xs text-gray-400 text-medium ml-1">({reviews.length})</span>
                </div>
                <Separator orientation="vertical" className="h-4" />
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Eye className="h-4 w-4" />
                  <span>{totalViews}</span>
                </div>
              </div>

              <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl font-black text-gray-900">{formatPrice(product.price)}</span>
                  {hasDiscount && <span className="text-lg text-gray-400 line-through">{formatPrice(product.original_price!)}</span>}
                </div>
                <p className="text-xs text-green-600 mt-2 font-bold flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                  Pague em até {maxInstallments}x
                </p>
              </div>

              {/* Actions Desktop */}
              <div className="hidden sm:block space-y-4 pt-4">
                <div className="grid grid-cols-12 gap-3">
                  <div className="col-span-4 flex items-center bg-gray-50 rounded-xl p-1 h-12 border border-gray-100">
                    <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="flex-1 flex justify-center text-gray-400 hover:text-wine"><Minus className="h-4 w-4" /></button>
                    <span className="w-8 text-center font-bold text-sm">{quantity}</span>
                    <button onClick={() => setQuantity(q => Math.min(maxQuantity, q + 1))} className="flex-1 flex justify-center text-gray-400 hover:text-wine"><Plus className="h-4 w-4" /></button>
                  </div>
                  <Button onClick={handleAddToCart} disabled={isAddingToCart || currentStock === 0} className="col-span-8 h-12 bg-wine hover:bg-wine-dark text-white rounded-xl shadow-lg shadow-wine/20 font-bold">
                    <ShoppingCart className="mr-2 h-5 w-5" /> Adicionar
                  </Button>
                </div>
                <Button onClick={async () => { await handleAddToCart(); navigate('/cart'); }} disabled={isAddingToCart || currentStock === 0} className="w-full h-12 bg-gray-900 text-white hover:bg-black rounded-xl font-black">
                  COMPRAR AGORA
                </Button>
              </div>

              <div className="flex gap-2 pt-2">
                <Dialog open={isGiftListDialogOpen} onOpenChange={setIsGiftListDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="flex-[2] h-10 text-[10px] font-bold border-gray-200 rounded-xl">
                      <Gift className="mr-2 h-4 w-4" /> LISTA DE PRESENTES
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Minhas Listas</DialogTitle></DialogHeader>
                    <div className="space-y-2 py-4">
                      {userLists?.map(list => (
                        <button key={list.id} onClick={() => handleAddToGiftList(list.id)} className="w-full flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-wine transition-all">
                          <span className="font-bold text-sm">{list.title}</span>
                          <ChevronRight className="h-4 w-4 text-gray-300" />
                        </button>
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>
                <Button variant="outline" size="icon" onClick={handleWishlistToggle} className={cn("h-10 w-10 shrink-0 rounded-xl", isInWishlist(product.id) && "text-red-500 bg-red-50 border-red-100")}>
                  <Heart className={cn("h-4 w-4", isInWishlist(product.id) && "fill-current")} />
                </Button>
                <Button variant="outline" size="icon" className="h-10 w-10 shrink-0 rounded-xl"><Share2 className="h-4 w-4" /></Button>
              </div>
            </div>

            {/* Seller Info Container */}
            <div className="border border-gray-100 rounded-2xl overflow-hidden bg-white divide-y divide-gray-50">
              {sellerProfile && (
                <div onClick={() => navigate(`/sellers/${product.seller_id}`)} className="p-4 flex items-center gap-3 cursor-pointer hover:bg-gray-50 transition-colors">
                  <Avatar className="h-10 w-10 border border-gray-100">
                    <AvatarImage src={sellerProfile.avatar_url} />
                    <AvatarFallback className="bg-wine text-white">{(sellerProfile.full_name || 'V').charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Loja parceira</p>
                    <div className="flex items-center gap-1">
                      <h3 className="text-sm font-bold text-gray-900">{sellerProfile.full_name}</h3>
                      {sellerProfile.verified && <CheckCircle className="h-3 w-3 text-blue-500 fill-white" />}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-300" />
                </div>
              )}

              <div className="p-4">
                <div className="flex items-center gap-2 mb-3 text-xs font-bold text-gray-700">
                  <Truck className="h-4 w-4 text-gray-400" /> Calcular Frete
                </div>
                <div className="flex gap-2">
                  <Input placeholder="CEP" value={cep} onChange={(e) => setCep(e.target.value)} maxLength={9} className="h-9 bg-gray-50 text-xs" />
                  <Button onClick={handleCalculateShipping} disabled={loadingShipping || cep.length < 8} className="h-9 px-4 text-xs font-bold bg-gray-900 text-white">OK</Button>
                </div>
                {shippingOptions.length > 0 && (
                  <div className="mt-3 space-y-2 border-t border-gray-50 pt-2">
                    {shippingOptions.map(opt => (
                      <div key={opt.id} className="flex justify-between items-center text-xs">
                        <span className="text-gray-500">{opt.name}</span>
                        <span className="font-bold text-gray-900">{formatPrice(opt.price)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-4 grid grid-cols-2 gap-4 bg-gray-50/30">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-green-500" />
                  <span className="text-[10px] font-bold text-gray-600 uppercase">Seguro</span>
                </div>
                <div className="flex items-center gap-2">
                  <RotateCcw className="h-4 w-4 text-blue-500" />
                  <span className="text-[10px] font-bold text-gray-600 uppercase">Troca Grátis</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* DETAILS SECTION */}
        <div className="lg:col-span-12 space-y-12">
          <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-wine"></div>
              <h3 className="font-serif font-bold text-gray-900">Sobre este item</h3>
            </div>
            <div className="p-6 sm:p-10">
              <div className="prose prose-gray max-w-none text-gray-600 leading-relaxed">
                {product.description || 'Descrição indisponível.'}
              </div>
              {product.tags && product.tags.length > 0 && (
                <div className="mt-8 flex flex-wrap gap-2">
                  {product.tags.map(tag => <Badge key={tag} variant="secondary" className="bg-gray-50 text-gray-500 border-none">{tag}</Badge>)}
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-xl font-serif font-bold text-gray-900 mb-6">Avaliações ({reviews.length})</h3>
            <div className="grid gap-4 md:grid-cols-2">
              {reviews.map(review => (
                <div key={review.id} className="bg-white p-6 rounded-2xl border border-gray-100 flex gap-4">
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarImage src={review.user.avatar} />
                    <AvatarFallback>{review.user.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-sm text-gray-900">{review.user.name}</span>
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => <Star key={i} className={cn("h-3 w-3", i < review.rating ? "text-amber-400 fill-current" : "text-gray-200")} />)}
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 line-clamp-3">{review.comment}</p>
                  </div>
                </div>
              ))}
              {reviews.length === 0 && <div className="col-span-full py-12 text-center bg-gray-50 rounded-2xl text-gray-400 text-sm">Ainda não há avaliações para este item.</div>}
            </div>
          </div>

          {relatedProducts.length > 0 && (
            <div className="pb-20">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-serif font-bold text-gray-900">Também pode interessar</h3>
                <Button variant="link" onClick={() => navigate('/products')} className="text-wine font-bold">Ver tudo</Button>
              </div>
              <ProductGrid products={relatedProducts} loading={false} className="grid-cols-2 md:grid-cols-4 gap-4" />
            </div>
          )}
        </div>
      </div>

      {/* MOBILE STICKY BOTTOM BAR */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-t border-gray-100 p-4 sm:hidden flex items-center justify-between shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Total</span>
          <span className="text-xl font-black text-gray-900 leading-none">{formatPrice(product.price * quantity)}</span>
        </div>
        <Button onClick={async () => { await handleAddToCart(); navigate('/cart'); }} disabled={isAddingToCart || currentStock === 0} className="px-8 h-12 bg-wine hover:bg-wine-dark text-white rounded-xl font-black text-xs">
          COMPRAR AGORA
        </Button>
      </div>
    </div>
  );
};

export default ProductDetail;

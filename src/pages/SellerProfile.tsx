import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Star,
  MapPin,
  Clock,
  CheckCircle,
  Phone,
  Mail,
  Globe,
  Instagram,
  Facebook,
  Calendar,
  Package,
  ArrowLeft,
  Share2,
  Heart,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ProductCard } from '@/components/ProductCard';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useSeller } from '@/hooks/useSellers';
import { useProducts } from '@/hooks/useProducts';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';


// Reviews Component (Mock for now)
const Reviews: React.FC<{ sellerId: string }> = ({ sellerId }) => {
  const mockReviews = [
    {
      id: '1',
      customerName: 'Ana Silva',
      rating: 5,
      comment: 'Produtos de excelente qualidade! Atendimento muito atencioso e entrega rápida.',
      date: '2024-01-15',
      verified: true
    },
    {
      id: '2',
      customerName: 'Carlos Santos',
      rating: 4,
      comment: 'Muito satisfeito com a compra. O produto chegou exatamente como esperado.',
      date: '2024-01-10',
      verified: true
    },
    {
      id: '3',
      customerName: 'Maria Oliveira',
      rating: 5,
      comment: 'Adorei! Já é a segunda vez que compro e sempre supera as expectativas.',
      date: '2024-01-05',
      verified: false
    }
  ];

  return (
    <div className="space-y-4">
      {mockReviews.map((review) => (
        <Card key={review.id}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center">
                <Avatar className="w-8 h-8 mr-3">
                  <AvatarFallback>
                    {review.customerName.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center">
                    <span className="font-medium text-sm">{review.customerName}</span>
                    {review.verified && (
                      <CheckCircle className="w-3 h-3 text-green-600 ml-1" />
                    )}
                  </div>
                  <div className="flex items-center mt-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3 h-3 ${i < review.rating
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                          }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <span className="text-xs text-gray-500">
                {new Date(review.date).toLocaleDateString('pt-BR')}
              </span>
            </div>
            <p className="text-gray-700 text-sm">{review.comment}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

// Main Seller Profile Component
export const SellerProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { seller, loading, error } = useSeller(id!);
  const { products, loading: productsLoading } = useProducts({ initialFilters: { sellerId: id } });
  const [activeTab, setActiveTab] = useState('products');

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: seller?.name,
        text: seller?.description,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copiado para a área de transferência!');
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !seller) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Vendedor não encontrado
          </h2>
          <p className="text-gray-600 mb-4">
            O vendedor que você está procurando não existe ou foi removido.
          </p>
          <Button asChild>
            <Link to="/sellers">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar para vendedores
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Cover Image */}
      <div className="relative h-64 bg-gradient-to-r from-primary/10 to-primary/5">
        {seller.coverImage ? (
          <img
            src={seller.coverImage}
            alt={`${seller.name} cover`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-wine/5 to-wine/10" />
        )}

        {/* Back Button */}
        <div className="absolute top-4 left-4">
          <Button variant="secondary" size="sm" asChild>
            <Link to="/sellers">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Link>
          </Button>
        </div>

        {/* Action Buttons */}
        <div className="absolute top-4 right-4 flex gap-2">
          <Button variant="secondary" size="sm" onClick={handleShare}>
            <Share2 className="w-4 h-4" />
          </Button>
          <Button variant="secondary" size="sm">
            <Heart className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Profile Header */}
        <div className="relative -mt-20 mb-8">
          <Card className="border-none shadow-xl bg-white/80 backdrop-blur-md overflow-hidden">
            <CardContent className="p-0">
              <div className="flex flex-col lg:flex-row">
                {/* Identity Sidebar - Profile Info */}
                <div className="p-8 lg:w-80 bg-gradient-to-b from-white to-gray-50/50 border-r border-gray-100 flex flex-col items-center text-center">
                  <div className="relative mb-6">
                    <Avatar className="w-32 h-32 border-4 border-white shadow-2xl">
                      <AvatarImage src={seller.avatar} alt={seller.name} />
                      <AvatarFallback className="text-4xl bg-wine-50 text-wine">
                        {seller.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {seller.verified && (
                      <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-1.5 shadow-lg border border-gray-100">
                        <CheckCircle className="w-6 h-6 text-green-500 fill-white" />
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-center mb-2">
                    <h1 className="text-3xl font-bold text-gray-900 leading-tight text-center">
                      {seller.name}
                    </h1>
                    {seller.subscriptionPlan && (
                      <Badge className={cn(
                        "mt-2 text-xs uppercase tracking-wider",
                        seller.subscriptionPlan.toLowerCase().includes('gold') || seller.subscriptionPlan.toLowerCase().includes('ouro') ? "bg-amber-400 hover:bg-amber-500 text-white border-none" :
                          seller.subscriptionPlan.toLowerCase().includes('silver') || seller.subscriptionPlan.toLowerCase().includes('prata') ? "bg-slate-400 hover:bg-slate-500 text-white border-none" :
                            "bg-wine text-white border-none"
                      )}>
                        {seller.subscriptionPlan}
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 mb-3 bg-champagne/10 px-3 py-1 rounded-full">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <span className="font-bold text-gray-900">{seller.rating.toFixed(1)}</span>
                    <span className="text-gray-500 text-xs">
                      ({seller.reviewCount} avaliações)
                    </span>
                  </div>

                  <div className="flex items-center text-gray-500 text-sm">
                    <MapPin className="w-4 h-4 mr-1.5 text-wine/60" />
                    <span>{seller.location}</span>
                  </div>
                </div>

                {/* Main Content Area - Bio & Stats */}
                <div className="flex-1 p-8 flex flex-col justify-between">
                  <div className="mb-8">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-wine mb-4">Sobre a Loja</h3>
                    <p className="text-gray-700 leading-relaxed text-lg italic serif">
                      "{seller.description}"
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-gray-100">
                    <div className="bg-white p-4 rounded-2xl border border-gray-50 shadow-sm flex items-center gap-4 transition-all hover:shadow-md">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                        <Clock className="w-5 h-5 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Resposta</p>
                        <p className="text-sm font-semibold text-gray-700">{seller.responseTime}</p>
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-gray-50 shadow-sm flex items-center gap-4 transition-all hover:shadow-md">
                      <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
                        <Calendar className="w-5 h-5 text-purple-500" />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Membro desde</p>
                        <p className="text-sm font-semibold text-gray-700">
                          {new Date(seller.joinedAt).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-gray-50 shadow-sm flex items-center gap-4 transition-all hover:shadow-md">
                      <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
                        <Package className="w-5 h-5 text-orange-500" />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Catálogo</p>
                        <p className="text-sm font-semibold text-gray-700">
                          {seller.productCount || 0} {seller.productCount === 1 ? 'produto' : 'produtos'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {seller.specialties && seller.specialties.length > 0 && (
                    <div className="mt-8 flex flex-wrap gap-2">
                      {seller.specialties.map((specialty, index) => (
                        <Badge key={index} variant="outline" className="bg-gray-50/50 border-gray-200 text-gray-600 px-3 py-1">
                          {specialty}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-12">
          <div className="flex justify-center mb-10">
            <TabsList className="bg-gray-100/50 p-1 rounded-full border border-gray-200/50 backdrop-blur-sm">
              <TabsTrigger
                value="products"
                className="rounded-full px-8 py-2.5 data-[state=active]:bg-wine data-[state=active]:text-white transition-all duration-300"
              >
                Produtos
              </TabsTrigger>
              <TabsTrigger
                value="reviews"
                className="rounded-full px-8 py-2.5 data-[state=active]:bg-wine data-[state=active]:text-white transition-all duration-300"
              >
                Avaliações
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="products" className="mt-6">
            {productsLoading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner size="lg" />
              </div>
            ) : products.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Nenhum produto encontrado
                </h3>
                <p className="text-gray-600">
                  Este vendedor ainda não possui produtos cadastrados.
                </p>
              </div>
            )}
          </TabsContent>


          <TabsContent value="reviews" className="mt-6">
            <div className="max-w-4xl">
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">
                  Avaliações dos Clientes
                </h2>
                <div className="flex items-center gap-4">
                  <div className="flex items-center">
                    <Star className="w-5 h-5 text-yellow-400 fill-current mr-1" />
                    <span className="text-lg font-medium">{seller.rating.toFixed(1)}</span>
                  </div>
                  <span className="text-gray-600">
                    Baseado em {seller.reviewCount} avaliações
                  </span>
                </div>
              </div>
              <Reviews sellerId={seller.id} />
            </div>
          </TabsContent>

        </Tabs>
      </div>
    </div>
  );
};

export default SellerProfile;
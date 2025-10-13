import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Star,
  MapPin,
  Clock,
  CheckCircle,
  MessageCircle,
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

// Contact Info Component
const ContactInfo: React.FC<{ seller: any }> = ({ seller }) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center">
        <MessageCircle className="w-5 h-5 mr-2" />
        Informações de Contato
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      {seller.email && (
        <div className="flex items-center">
          <Mail className="w-4 h-4 text-gray-500 mr-3" />
          <a
            href={`mailto:${seller.email}`}
            className="text-primary hover:underline"
          >
            {seller.email}
          </a>
        </div>
      )}
      
      {seller.phone && (
        <div className="flex items-center">
          <Phone className="w-4 h-4 text-gray-500 mr-3" />
          <a
            href={`tel:${seller.phone}`}
            className="text-primary hover:underline"
          >
            {seller.phone}
          </a>
        </div>
      )}
      
      {seller.website && (
        <div className="flex items-center">
          <Globe className="w-4 h-4 text-gray-500 mr-3" />
          <a
            href={seller.website}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline flex items-center"
          >
            {seller.website}
            <ExternalLink className="w-3 h-3 ml-1" />
          </a>
        </div>
      )}

      {seller.socialMedia && (
        <div className="pt-2">
          <h4 className="font-medium mb-2">Redes Sociais</h4>
          <div className="space-y-2">
            {seller.socialMedia.instagram && (
              <div className="flex items-center">
                <Instagram className="w-4 h-4 text-gray-500 mr-3" />
                <a
                  href={`https://instagram.com/${seller.socialMedia.instagram.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  {seller.socialMedia.instagram}
                </a>
              </div>
            )}
            
            {seller.socialMedia.facebook && (
              <div className="flex items-center">
                <Facebook className="w-4 h-4 text-gray-500 mr-3" />
                <span className="text-gray-700">{seller.socialMedia.facebook}</span>
              </div>
            )}
            
            {seller.socialMedia.whatsapp && (
              <div className="flex items-center">
                <MessageCircle className="w-4 h-4 text-gray-500 mr-3" />
                <a
                  href={`https://wa.me/${seller.socialMedia.whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  WhatsApp
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </CardContent>
  </Card>
);

// Business Hours Component
const BusinessHours: React.FC<{ seller: any }> = ({ seller }) => {
  if (!seller.businessHours) return null;

  const days = [
    { key: 'monday', label: 'Segunda-feira' },
    { key: 'tuesday', label: 'Terça-feira' },
    { key: 'wednesday', label: 'Quarta-feira' },
    { key: 'thursday', label: 'Quinta-feira' },
    { key: 'friday', label: 'Sexta-feira' },
    { key: 'saturday', label: 'Sábado' },
    { key: 'sunday', label: 'Domingo' }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Clock className="w-5 h-5 mr-2" />
          Horário de Funcionamento
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {days.map(({ key, label }) => (
            <div key={key} className="flex justify-between">
              <span className="text-gray-600">{label}</span>
              <span className="font-medium">
                {seller.businessHours[key] || 'Fechado'}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// Policies Component
const Policies: React.FC<{ seller: any }> = ({ seller }) => {
  if (!seller.policies) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Políticas da Loja</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {seller.policies.returns && (
          <div>
            <h4 className="font-medium mb-1">Política de Devolução</h4>
            <p className="text-gray-600 text-sm">{seller.policies.returns}</p>
          </div>
        )}
        
        {seller.policies.shipping && (
          <div>
            <h4 className="font-medium mb-1">Política de Envio</h4>
            <p className="text-gray-600 text-sm">{seller.policies.shipping}</p>
          </div>
        )}
        
        {seller.policies.customization && (
          <div>
            <h4 className="font-medium mb-1">Personalização</h4>
            <p className="text-gray-600 text-sm">{seller.policies.customization}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

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
                        className={`w-3 h-3 ${
                          i < review.rating
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
  const { products, loading: productsLoading } = useProducts({ sellerId: id });
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

  const handleContact = () => {
    if (seller?.socialMedia?.whatsapp) {
      window.open(`https://wa.me/${seller.socialMedia.whatsapp}`, '_blank');
    } else if (seller?.email) {
      window.open(`mailto:${seller.email}`, '_blank');
    } else {
      toast.info('Informações de contato não disponíveis');
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
          <div className="w-full h-full bg-gradient-to-r from-primary/10 to-primary/5" />
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
        <div className="relative -mt-16 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Avatar and Basic Info */}
                <div className="flex flex-col sm:flex-row gap-4 lg:flex-col lg:w-48">
                  <Avatar className="w-24 h-24 border-4 border-white shadow-lg">
                    <AvatarImage src={seller.avatar} alt={seller.name} />
                    <AvatarFallback className="text-2xl">
                      {seller.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 lg:text-center">
                    <div className="flex items-center gap-2 lg:justify-center">
                      <h1 className="text-2xl font-bold">{seller.name}</h1>
                      {seller.verified && (
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      )}
                    </div>
                    
                    <div className="flex items-center gap-1 mt-2 lg:justify-center">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="font-medium">{seller.rating.toFixed(1)}</span>
                      <span className="text-gray-500">
                        ({seller.reviewCount} avaliações)
                      </span>
                    </div>
                    
                    <div className="flex items-center text-gray-500 mt-2 lg:justify-center">
                      <MapPin className="w-4 h-4 mr-1" />
                      <span className="text-sm">{seller.location}</span>
                    </div>
                  </div>
                </div>

                {/* Description and Details */}
                <div className="flex-1">
                  <p className="text-gray-700 mb-4">{seller.description}</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center text-gray-600">
                      <Clock className="w-4 h-4 mr-2" />
                      <span className="text-sm">Responde em {seller.responseTime}</span>
                    </div>
                    
                    <div className="flex items-center text-gray-600">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span className="text-sm">
                        Desde {new Date(seller.joinedAt).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    
                    {seller.productCount && (
                      <div className="flex items-center text-gray-600">
                        <Package className="w-4 h-4 mr-2" />
                        <span className="text-sm">
                          {seller.productCount} {seller.productCount === 1 ? 'produto' : 'produtos'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Specialties */}
                  <div className="mb-4">
                    <h3 className="font-medium mb-2">Especialidades</h3>
                    <div className="flex flex-wrap gap-2">
                      {seller.specialties.map((specialty, index) => (
                        <Badge key={index} variant="outline">
                          {specialty}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-3">
                    <Button onClick={handleContact} className="flex-1 sm:flex-none">
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Entrar em Contato
                    </Button>
                    
                    {seller.socialMedia?.whatsapp && (
                      <Button
                        variant="outline"
                        onClick={() => window.open(`https://wa.me/${seller.socialMedia.whatsapp}`, '_blank')}
                      >
                        WhatsApp
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="products">Produtos</TabsTrigger>
            <TabsTrigger value="about">Sobre</TabsTrigger>
            <TabsTrigger value="reviews">Avaliações</TabsTrigger>
            <TabsTrigger value="contact">Contato</TabsTrigger>
          </TabsList>

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

          <TabsContent value="about" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <BusinessHours seller={seller} />
              <Policies seller={seller} />
            </div>
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

          <TabsContent value="contact" className="mt-6">
            <div className="max-w-2xl">
              <ContactInfo seller={seller} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SellerProfile;
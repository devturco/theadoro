import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useRole } from '@/hooks/useRole';
import { 
  Heart, 
  ShoppingCart, 
  Trash2, 
  Search,
  Filter,
  Star,
  Eye,
  Share2
} from 'lucide-react';

interface WishlistItem {
  id: string;
  product_id: string;
  product_name: string;
  product_description: string;
  product_price: number;
  product_image: string;
  seller_name: string;
  seller_id: string;
  category: string;
  is_available: boolean;
  rating: number;
  added_at: string;
}

export default function BuyerWishlist() {
  const { user } = useAuth();
  const { hasRole } = useRole();
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [availabilityFilter, setAvailabilityFilter] = useState<string>('all');

  const isBuyer = hasRole('buyer');

  useEffect(() => {
    if (user && isBuyer) {
      loadWishlist();
    }
  }, [user, isBuyer]);

  const loadWishlist = async () => {
    try {
      setLoading(true);
      
      // Mock data - replace with actual API calls
      const mockWishlistItems: WishlistItem[] = [
        {
          id: '1',
          product_id: 'prod1',
          product_name: 'Colar Personalizado com Nome',
          product_description: 'Lindo colar personalizado em prata com gravação do nome',
          product_price: 299.90,
          product_image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=elegant%20personalized%20silver%20necklace%20with%20name%20engraving&image_size=square',
          seller_name: 'Artesanatos Maria',
          seller_id: 'seller1',
          category: 'Joias',
          is_available: true,
          rating: 4.8,
          added_at: '2024-01-15T10:30:00Z'
        },
        {
          id: '2',
          product_id: 'prod2',
          product_name: 'Pulseira Artesanal',
          product_description: 'Pulseira feita à mão com materiais naturais',
          product_price: 75.00,
          product_image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=handmade%20natural%20bracelet%20artisan%20jewelry&image_size=square',
          seller_name: 'Joias Premium',
          seller_id: 'seller2',
          category: 'Acessórios',
          is_available: true,
          rating: 4.5,
          added_at: '2024-01-14T14:20:00Z'
        },
        {
          id: '3',
          product_id: 'prod3',
          product_name: 'Kit Presente Especial',
          product_description: 'Kit completo com caixa personalizada e produtos exclusivos',
          product_price: 450.00,
          product_image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=luxury%20gift%20box%20set%20personalized%20special%20occasion&image_size=square',
          seller_name: 'Presentes Especiais',
          seller_id: 'seller3',
          category: 'Presentes',
          is_available: false,
          rating: 4.9,
          added_at: '2024-01-13T09:15:00Z'
        },
        {
          id: '4',
          product_id: 'prod4',
          product_name: 'Anel de Noivado Personalizado',
          product_description: 'Anel único com design exclusivo para momentos especiais',
          product_price: 1200.00,
          product_image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=custom%20engagement%20ring%20unique%20design%20elegant&image_size=square',
          seller_name: 'Joias Premium',
          seller_id: 'seller2',
          category: 'Joias',
          is_available: true,
          rating: 5.0,
          added_at: '2024-01-12T16:45:00Z'
        }
      ];

      setWishlistItems(mockWishlistItems);
    } catch (error) {
      console.error('Error loading wishlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFromWishlist = async (itemId: string) => {
    try {
      // Remove from wishlist - replace with actual API call
      setWishlistItems(prev => prev.filter(item => item.id !== itemId));
    } catch (error) {
      console.error('Error removing from wishlist:', error);
    }
  };

  const handleAddToCart = async (productId: string) => {
    try {
      // Add to cart - replace with actual API call
      console.log('Adding to cart:', productId);
      // Show success message
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  const handleShareProduct = (productId: string) => {
    // Share product functionality
    if (navigator.share) {
      navigator.share({
        title: 'Confira este produto incrível!',
        url: `${window.location.origin}/product/${productId}`
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(`${window.location.origin}/product/${productId}`);
    }
  };

  const categories = Array.from(new Set(wishlistItems.map(item => item.category)));

  const filteredItems = wishlistItems.filter(item => {
    const matchesSearch = item.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.seller_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    const matchesAvailability = availabilityFilter === 'all' || 
                               (availabilityFilter === 'available' && item.is_available) ||
                               (availabilityFilter === 'unavailable' && !item.is_available);
    
    return matchesSearch && matchesCategory && matchesAvailability;
  });

  if (!isBuyer) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Acesso negado</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Minha Lista de Desejos</h1>
          <p className="text-muted-foreground">
            {wishlistItems.length} {wishlistItems.length === 1 ? 'item salvo' : 'itens salvos'}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Itens</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{wishlistItems.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disponíveis</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {wishlistItems.filter(item => item.is_available).length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {wishlistItems.reduce((sum, item) => sum + item.product_price, 0).toFixed(2)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categorias</CardTitle>
            <Filter className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="search">Buscar produto</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Nome do produto ou vendedor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as categorias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="availability">Disponibilidade</Label>
              <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os itens" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os itens</SelectItem>
                  <SelectItem value="available">Disponíveis</SelectItem>
                  <SelectItem value="unavailable">Indisponíveis</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Wishlist Items */}
      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="aspect-square bg-muted rounded-t-lg" />
              <CardContent className="p-4">
                <div className="h-4 bg-muted rounded mb-2" />
                <div className="h-3 bg-muted rounded mb-4" />
                <div className="h-6 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Heart className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum item encontrado</h3>
            <p className="text-muted-foreground text-center">
              {searchTerm || categoryFilter !== 'all' || availabilityFilter !== 'all'
                ? 'Tente ajustar os filtros para encontrar produtos.'
                : 'Sua lista de desejos está vazia. Explore nossos produtos e adicione seus favoritos!'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((item) => (
            <Card key={item.id} className="overflow-hidden">
              <div className="relative">
                <img
                  src={item.product_image}
                  alt={item.product_name}
                  className="aspect-square object-cover w-full"
                />
                {!item.is_available && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Badge variant="destructive">Indisponível</Badge>
                  </div>
                )}
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute top-2 right-2 bg-white/80 hover:bg-white"
                  onClick={() => handleRemoveFromWishlist(item.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold line-clamp-2">{item.product_name}</h3>
                  </div>
                  
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {item.product_description}
                  </p>
                  
                  <div className="flex items-center gap-2">
                    <div className="flex items-center">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm ml-1">{item.rating}</span>
                    </div>
                    <Badge variant="outline">{item.category}</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-lg font-bold">R$ {item.product_price.toFixed(2)}</p>
                      <p className="text-sm text-muted-foreground">por {item.seller_name}</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                    <Button
                      className="flex-1"
                      disabled={!item.is_available}
                      onClick={() => handleAddToCart(item.product_id)}
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      {item.is_available ? 'Adicionar ao Carrinho' : 'Indisponível'}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleShareProduct(item.product_id)}
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <p className="text-xs text-muted-foreground">
                    Adicionado em {new Date(item.added_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
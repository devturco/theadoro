import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useRole } from '@/hooks/useRole';
import { useCRUD } from '@/hooks/useCRUD';
import { useNavigate } from 'react-router-dom';
import { 
  ShoppingCart, 
  Calendar, 
  Heart, 
  Package,
  Clock,
  CheckCircle,
  Star
} from 'lucide-react';

interface BuyerMetrics {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  totalSpent: number;
  wishlistItems: number;
  upcomingAppointments: number;
  recentOrders: any[];
  favoriteProducts: any[];
}

export default function BuyerDashboard() {
  const { user, profile } = useAuth();
  const { hasRole } = useRole();
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<BuyerMetrics>({
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalSpent: 0,
    wishlistItems: 0,
    upcomingAppointments: 0,
    recentOrders: [],
    favoriteProducts: []
  });
  const [loading, setLoading] = useState(true);

  const isBuyer = hasRole('buyer');

  useEffect(() => {
    if (user && isBuyer) {
      loadBuyerMetrics();
    }
  }, [user, isBuyer]);

  const loadBuyerMetrics = async () => {
    try {
      setLoading(true);
      
      // Mock data - replace with actual API calls
      const mockMetrics: BuyerMetrics = {
        totalOrders: 12,
        pendingOrders: 2,
        completedOrders: 8,
        totalSpent: 2450.00,
        wishlistItems: 5,
        upcomingAppointments: 1,
        recentOrders: [
          {
            id: '1',
            seller_name: 'Artesanatos Maria',
            total_amount: 299.90,
            status: 'delivered',
            created_at: new Date().toISOString(),
            items: [{ product_name: 'Colar Personalizado', quantity: 1 }]
          },
          {
            id: '2',
            seller_name: 'Joias Premium',
            total_amount: 150.00,
            status: 'shipped',
            created_at: new Date().toISOString(),
            items: [{ product_name: 'Pulseira Artesanal', quantity: 2 }]
          }
        ],
        favoriteProducts: [
          {
            id: '1',
            name: 'Anel Customizado',
            seller_name: 'Joias Exclusivas',
            price: 450.00,
            image_url: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=elegant%20custom%20ring%20jewelry%20gold&image_size=square'
          },
          {
            id: '2',
            name: 'Brincos Especiais',
            seller_name: 'Artesanatos Únicos',
            price: 180.00,
            image_url: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=special%20earrings%20jewelry%20elegant&image_size=square'
          }
        ]
      };

      setMetrics(mockMetrics);
    } catch (error) {
      console.error('Error loading buyer metrics:', error);
    } finally {
      setLoading(false);
    }
  };

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
          <h1 className="text-3xl font-bold">Olá, {profile?.full_name || 'Cliente'}!</h1>
          <p className="text-muted-foreground">
            Bem-vindo ao seu painel pessoal
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/buyer/orders')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Meus Pedidos</CardTitle>
            <ShoppingCart className="h-4 w-4 text-wine" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.pendingOrders} pendentes
            </p>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/buyer/appointments')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agendamentos</CardTitle>
            <Calendar className="h-4 w-4 text-wine" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.upcomingAppointments}</div>
            <p className="text-xs text-muted-foreground">
              próximos
            </p>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/buyer/wishlist')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lista de Desejos</CardTitle>
            <Heart className="h-4 w-4 text-wine" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.wishlistItems}</div>
            <p className="text-xs text-muted-foreground">
              produtos salvos
            </p>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Gasto</CardTitle>
            <Package className="h-4 w-4 text-wine" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {metrics.totalSpent.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              em {metrics.completedOrders} pedidos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders and Favorite Products */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Pedidos Recentes
              <Button variant="outline" size="sm" onClick={() => navigate('/buyer/orders')}>
                Ver Todos
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {metrics.recentOrders.length > 0 ? (
              metrics.recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <p className="font-medium">#{order.id.slice(0, 8)}</p>
                    <p className="text-sm text-muted-foreground">{order.seller_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {order.items[0]?.product_name}
                      {order.items.length > 1 && ` +${order.items.length - 1} mais`}
                    </p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="font-medium">R$ {order.total_amount.toFixed(2)}</p>
                    <Badge variant={order.status === 'delivered' ? 'default' : 'secondary'}>
                      {order.status === 'delivered' ? 'Entregue' : 
                       order.status === 'shipped' ? 'Enviado' : 
                       order.status === 'confirmed' ? 'Confirmado' : 'Pendente'}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhum pedido encontrado</p>
                <Button variant="outline" className="mt-2" onClick={() => navigate('/')}>
                  Explorar Produtos
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Produtos Favoritos
              <Button variant="outline" size="sm" onClick={() => navigate('/buyer/wishlist')}>
                Ver Lista
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {metrics.favoriteProducts.length > 0 ? (
              metrics.favoriteProducts.map((product) => (
                <div key={product.id} className="flex items-center gap-4 p-4 border rounded-lg">
                  <img 
                    src={product.image_url} 
                    alt={product.name}
                    className="w-16 h-16 object-cover rounded-md"
                  />
                  <div className="flex-1 space-y-1">
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-muted-foreground">{product.seller_name}</p>
                    <p className="font-medium text-wine">R$ {product.price.toFixed(2)}</p>
                  </div>
                  <Button size="sm" variant="outline">
                    Ver
                  </Button>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhum produto favorito</p>
                <Button variant="outline" className="mt-2" onClick={() => navigate('/')}>
                  Explorar Produtos
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pedidos Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.pendingOrders}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pedidos Concluídos</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.completedOrders}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avaliações Pendentes</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">
              produtos para avaliar
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
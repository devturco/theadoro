import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MetricCard } from '@/components/ui/metric-card';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useRole } from '@/hooks/useRole';
import { useCRUD } from '@/hooks/useCRUD';
import { 
  Users, 
  Package, 
  ShoppingCart, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';

interface DashboardMetrics {
  totalUsers: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  pendingSellers: number;
  lowStockProducts: number;
  recentOrders: any[];
  pendingSellerRequests: any[];
}

const AdminDashboard = () => {
  const { user } = useAuth();
  const { isAdmin } = useRole();
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalUsers: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingSellers: 0,
    lowStockProducts: 0,
    recentOrders: [],
    pendingSellerRequests: []
  });
  const [loading, setLoading] = useState(true);

  const { 
    data: users, 
    loading: usersLoading,
    updateItem: updateUser 
  } = useCRUD('users');
  
  const { data: orders } = useCRUD('orders');
  const { data: products } = useCRUD('products');

  useEffect(() => {
    if (!isAdmin) {
      toast.error('Acesso negado. Apenas administradores podem acessar esta página.');
      return;
    }
    
    fetchDashboardMetrics();
  }, [isAdmin, users, orders, products]);

  const fetchDashboardMetrics = async () => {
    try {
      setLoading(true);
      
      // Calculate metrics from existing data
      const totalUsers = users?.length || 0;
      const totalProducts = products?.length || 0;
      const totalOrders = orders?.length || 0;
      const totalRevenue = orders?.reduce((sum: number, order: any) => sum + (order.total_amount || 0), 0) || 0;
      
      const pendingSellers = users?.filter((user: any) => 
        user.roles?.some((role: any) => role.role === 'seller' && role.status === 'pending')
      ).length || 0;
      
      const lowStockProducts = products?.filter((product: any) => 
        product.stock_quantity < 10
      ).length || 0;
      
      const recentOrders = orders?.slice(0, 5) || [];
      const pendingSellerRequests = users?.filter((user: any) => 
        user.roles?.some((role: any) => role.role === 'seller' && role.status === 'pending')
      ).slice(0, 5) || [];

      setMetrics({
        totalUsers,
        totalProducts,
        totalOrders,
        totalRevenue,
        pendingSellers,
        lowStockProducts,
        recentOrders,
        pendingSellerRequests
      });
    } catch (error) {
      console.error('Erro ao buscar métricas:', error);
      toast.error('Erro ao carregar métricas do dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveSeller = async (userId: string) => {
    try {
      await updateUser(userId, {
        roles: [{ role: 'seller', status: 'approved' }]
      });
      toast.success('Vendedor aprovado com sucesso!');
      fetchDashboardMetrics();
    } catch (error) {
      console.error('Erro ao aprovar vendedor:', error);
      toast.error('Erro ao aprovar vendedor');
    }
  };

  const handleRejectSeller = async (userId: string) => {
    try {
      await updateUser(userId, {
        roles: [{ role: 'buyer', status: 'approved' }]
      });
      toast.success('Solicitação de vendedor rejeitada');
      fetchDashboardMetrics();
    } catch (error) {
      console.error('Erro ao rejeitar vendedor:', error);
      toast.error('Erro ao rejeitar solicitação');
    }
  };

  const orderColumns = [
    {
      key: 'id',
      label: 'ID',
      render: (value: string) => `#${value.slice(0, 8)}`
    },
    {
      key: 'buyer_name',
      label: 'Cliente',
      render: (value: string) => value || 'N/A'
    },
    {
      key: 'total_amount',
      label: 'Total',
      render: (value: number) => `R$ ${value?.toFixed(2) || '0.00'}`
    },
    {
      key: 'status',
      label: 'Status',
      render: (value: string) => (
        <Badge variant={value === 'completed' ? 'default' : 'secondary'}>
          {value === 'pending' ? 'Pendente' : 
           value === 'confirmed' ? 'Confirmado' :
           value === 'shipped' ? 'Enviado' :
           value === 'delivered' ? 'Entregue' :
           value === 'cancelled' ? 'Cancelado' : 'Concluído'}
        </Badge>
      )
    },
    {
      key: 'actions',
      label: 'Ações',
      render: (_: any, row: any) => (
        <div className="flex gap-2">
          <Button variant="ghost" size="sm">
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <Edit className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  const sellerRequestColumns = [
    {
      key: 'name',
      label: 'Nome',
      render: (value: string) => value || 'N/A'
    },
    {
      key: 'email',
      label: 'Email'
    },
    {
      key: 'created_at',
      label: 'Data da Solicitação',
      render: (value: string) => new Date(value).toLocaleDateString('pt-BR')
    },
    {
      key: 'actions',
      label: 'Ações',
      render: (_: any, row: any) => (
        <div className="flex gap-2">
          <Button 
            variant="default" 
            size="sm"
            onClick={() => handleApproveSeller(row.id)}
          >
            Aprovar
          </Button>
          <Button 
            variant="destructive" 
            size="sm"
            onClick={() => handleRejectSeller(row.id)}
          >
            Rejeitar
          </Button>
        </div>
      )
    }
  ];

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Acesso negado</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard Administrativo</h1>
        <p className="text-muted-foreground">
          Bem-vindo, {user?.name || user?.email}
        </p>
      </div>

      {/* Métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total de Usuários"
          value={metrics.totalUsers}
          icon={Users}
          loading={loading}
        />
        <MetricCard
          title="Total de Produtos"
          value={metrics.totalProducts}
          icon={Package}
          loading={loading}
        />
        <MetricCard
          title="Total de Pedidos"
          value={metrics.totalOrders}
          icon={ShoppingCart}
          loading={loading}
        />
        <MetricCard
          title="Receita Total"
          value={metrics.totalRevenue}
          icon={DollarSign}
          format="currency"
          loading={loading}
        />
      </div>

      {/* Alertas e notificações */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <MetricCard
          title="Vendedores Pendentes"
          value={metrics.pendingSellers}
          icon={AlertTriangle}
          variant={metrics.pendingSellers > 0 ? 'warning' : 'default'}
          loading={loading}
        />
        <MetricCard
          title="Produtos com Estoque Baixo"
          value={metrics.lowStockProducts}
          icon={TrendingUp}
          variant={metrics.lowStockProducts > 0 ? 'destructive' : 'default'}
          loading={loading}
        />
      </div>

      {/* Tabelas de dados recentes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Pedidos Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              data={metrics.recentOrders}
              columns={orderColumns}
              loading={loading}
              pagination={false}
              searchable={false}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Solicitações de Vendedor</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              data={metrics.pendingSellerRequests}
              columns={sellerRequestColumns}
              loading={loading}
              pagination={false}
              searchable={false}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
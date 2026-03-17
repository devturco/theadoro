import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@theadoro/ui';
import { MetricCard } from '@theadoro/ui';
import { DataTable } from '@theadoro/ui';
import { Button } from '@theadoro/ui';
import { Badge } from '@theadoro/ui';
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
  UserPlus
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
    data: profiles,
    updateItem: updateUser
  } = useCRUD({ table: 'profiles' });

  const { data: orders } = useCRUD({ table: 'orders' });
  const { data: products } = useCRUD({ table: 'products' });

  useEffect(() => {
    if (!isAdmin) {
      return;
    }
    updateDashboardMetrics();
  }, [isAdmin, profiles, orders, products]);

  const updateDashboardMetrics = () => {
    try {
      setLoading(true);

      const totalUsers = profiles?.length || 0;
      const totalProducts = products?.length || 0;
      const totalOrders = orders?.length || 0;
      const totalRevenue = orders?.reduce((sum: number, order: any) => sum + (order.total_amount || 0), 0) || 0;

      const pendingSellers = 0; // Placeholder until roles logic is solid

      const lowStockProducts = products?.filter((product: any) =>
        (product.stock_quantity || 0) < 10
      ).length || 0;

      const recentOrders = orders?.slice(0, 5) || [];
      const pendingSellerRequests: any[] = [];

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
      console.error('Erro ao calcular métricas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveSeller = async (userId: string) => {
    try {
      await updateUser(userId, {
        // @ts-ignore - role structure might differ in useCRUD types vs DB
        roles: [{ role: 'seller', status: 'approved' }]
      });
      toast.success('Vendedor aprovado com sucesso!');
      updateDashboardMetrics();
    } catch (error) {
      console.error('Erro ao aprovar vendedor:', error);
      toast.error('Erro ao aprovar vendedor');
    }
  };

  const handleRejectSeller = async (userId: string) => {
    try {
      await updateUser(userId, {
        // @ts-ignore
        roles: [{ role: 'buyer', status: 'approved' }]
      });
      toast.success('Solicitação de vendedor rejeitada');
      updateDashboardMetrics();
    } catch (error) {
      console.error('Erro ao rejeitar vendedor:', error);
      toast.error('Erro ao rejeitar solicitação');
    }
  };

  const orderColumns = [
    {
      key: 'id',
      title: 'ID',
      render: (value: string) => `#${value.slice(0, 8)}`
    },
    {
      key: 'buyer_name',
      title: 'Cliente',
      render: (value: string) => value || 'N/A'
    },
    {
      key: 'total_amount',
      title: 'Total',
      render: (value: number) => `R$ ${value?.toFixed(2) || '0.00'}`
    },
    {
      key: 'status',
      title: 'Status',
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
      title: 'Ações',
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
      title: 'Nome',
      render: (value: string) => value || 'N/A'
    },
    {
      key: 'email',
      title: 'Email'
    },
    {
      key: 'created_at',
      title: 'Data',
      render: (value: string) => new Date(value).toLocaleDateString('pt-BR')
    },
    {
      key: 'actions',
      title: 'Ações',
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-sm text-gray-500">Welcome back, {profiles?.find((p: any) => p.id === user?.id)?.full_name || 'Admin'}</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Add any global admin actions here */}
        </div>
      </div>

      {/* Métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total de Usuários"
          value={metrics.totalUsers}
          icon={<Users className="h-4 w-4" />}
          description="Usuários cadastrados"
          variant="default"
        />
        <MetricCard
          title="Total de Pedidos"
          value={metrics.totalOrders}
          icon={<ShoppingCart className="h-4 w-4" />}
          description="Pedidos realizados"
          variant="default"
        />
        <MetricCard
          title="Receita Total"
          value={metrics.totalRevenue}
          icon={<DollarSign className="h-4 w-4" />}
          description="Faturamento total"
          variant="success"
        />
        <MetricCard
          title="Produtos"
          value={metrics.totalProducts}
          icon={<Package className="h-4 w-4" />}
          description="Produtos ativos"
          variant="default"
        />
      </div>

      {/* Alertas e notificações */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <MetricCard
          title="Vendedores Pendentes"
          value={metrics.pendingSellers}
          icon={<UserPlus className="h-4 w-4" />}
          variant={metrics.pendingSellers > 0 ? 'warning' : 'default'}
          description="Aguardando aprovação"
        />
        <MetricCard
          title="Produtos com Estoque Baixo"
          value={metrics.lowStockProducts}
          icon={<AlertTriangle className="h-4 w-4" />}
          variant={metrics.lowStockProducts > 0 ? 'destructive' : 'default'}
          description="Menor que 10 unidades"
        />
      </div>

      {/* Tabelas de dados recentes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Pedidos Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <DataTable
                data={metrics.recentOrders}
                columns={orderColumns}
                loading={loading}
                pagination={{ page: 1, pageSize: 5, total: metrics.recentOrders.length, totalPages: 1 }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Solicitações de Vendedor</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <DataTable
                data={metrics.pendingSellerRequests}
                columns={sellerRequestColumns}
                loading={loading}
                pagination={{ page: 1, pageSize: 5, total: metrics.pendingSellerRequests.length, totalPages: 1 }}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
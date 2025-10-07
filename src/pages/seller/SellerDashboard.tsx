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
  Package, 
  ShoppingBag, 
  Calendar, 
  DollarSign,
  TrendingUp,
  Eye
} from 'lucide-react';

interface SellerMetrics {
  totalProducts: number;
  activeProducts: number;
  totalSales: number;
  totalRevenue: number;
  pendingAppointments: number;
  monthlyRevenue: number;
  recentOrders: any[];
  upcomingAppointments: any[];
}

export default function SellerDashboard() {
  const { user } = useAuth();
  const { hasRole } = useRole();
  const [metrics, setMetrics] = useState<SellerMetrics>({
    totalProducts: 0,
    activeProducts: 0,
    totalSales: 0,
    totalRevenue: 0,
    pendingAppointments: 0,
    monthlyRevenue: 0,
    recentOrders: [],
    upcomingAppointments: []
  });
  const [loading, setLoading] = useState(true);

  const isSeller = hasRole('seller');

  useEffect(() => {
    if (user && isSeller) {
      loadSellerMetrics();
    }
  }, [user, isSeller]);

  const loadSellerMetrics = async () => {
    try {
      setLoading(true);
      
      // Mock data - replace with actual API calls
      const mockMetrics: SellerMetrics = {
        totalProducts: 25,
        activeProducts: 22,
        totalSales: 156,
        totalRevenue: 45600.00,
        pendingAppointments: 8,
        monthlyRevenue: 12300.00,
        recentOrders: [
          {
            id: '1',
            buyer_name: 'Maria Silva',
            total_amount: 299.90,
            status: 'confirmed',
            created_at: new Date().toISOString()
          },
          {
            id: '2',
            buyer_name: 'João Santos',
            total_amount: 150.00,
            status: 'pending',
            created_at: new Date().toISOString()
          }
        ],
        upcomingAppointments: [
          {
            id: '1',
            buyer_name: 'Ana Costa',
            appointment_date: new Date(Date.now() + 86400000).toISOString(),
            status: 'confirmed',
            notes: 'Consulta sobre produtos personalizados'
          }
        ]
      };

      setMetrics(mockMetrics);
    } catch (error) {
      console.error('Error loading seller metrics:', error);
    } finally {
      setLoading(false);
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
      render: (value: string) => {
        const statusMap = {
          pending: { label: 'Pendente', variant: 'secondary' as const },
          confirmed: { label: 'Confirmado', variant: 'default' as const },
          processing: { label: 'Processando', variant: 'default' as const },
          shipped: { label: 'Enviado', variant: 'default' as const },
          delivered: { label: 'Entregue', variant: 'default' as const },
          cancelled: { label: 'Cancelado', variant: 'destructive' as const }
        };
        const status = statusMap[value as keyof typeof statusMap] || statusMap.pending;
        return <Badge variant={status.variant}>{status.label}</Badge>;
      }
    },
    {
      key: 'actions',
      label: 'Ações',
      render: () => (
        <Button variant="outline" size="sm">
          <Eye className="h-4 w-4 mr-1" />
          Ver
        </Button>
      )
    }
  ];

  const appointmentColumns = [
    {
      key: 'buyer_name',
      label: 'Cliente',
      render: (value: string) => value || 'N/A'
    },
    {
      key: 'appointment_date',
      label: 'Data',
      render: (value: string) => new Date(value).toLocaleDateString('pt-BR')
    },
    {
      key: 'status',
      label: 'Status',
      render: (value: string) => {
        const statusMap = {
          pending: { label: 'Pendente', variant: 'secondary' as const },
          confirmed: { label: 'Confirmado', variant: 'default' as const },
          completed: { label: 'Concluído', variant: 'default' as const },
          cancelled: { label: 'Cancelado', variant: 'destructive' as const }
        };
        const status = statusMap[value as keyof typeof statusMap] || statusMap.pending;
        return <Badge variant={status.variant}>{status.label}</Badge>;
      }
    },
    {
      key: 'actions',
      label: 'Ações',
      render: () => (
        <Button variant="outline" size="sm">
          <Eye className="h-4 w-4 mr-1" />
          Ver
        </Button>
      )
    }
  ];

  if (!isSeller) {
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
          <h1 className="text-3xl font-bold">Dashboard do Vendedor</h1>
          <p className="text-muted-foreground">
            Visão geral das suas vendas e produtos
          </p>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          title="Total de Produtos"
          value={metrics.totalProducts}
          icon={Package}
          loading={loading}
        />
        <MetricCard
          title="Produtos Ativos"
          value={metrics.activeProducts}
          icon={Package}
          loading={loading}
        />
        <MetricCard
          title="Total de Vendas"
          value={metrics.totalSales}
          icon={ShoppingBag}
          loading={loading}
        />
        <MetricCard
          title="Receita Total"
          value={`R$ ${metrics.totalRevenue.toLocaleString()}`}
          icon={DollarSign}
          loading={loading}
        />
        <MetricCard
          title="Receita Mensal"
          value={`R$ ${metrics.monthlyRevenue.toLocaleString()}`}
          icon={TrendingUp}
          loading={loading}
        />
        <MetricCard
          title="Agendamentos Pendentes"
          value={metrics.pendingAppointments}
          icon={Calendar}
          loading={loading}
        />
      </div>

      {/* Recent Orders and Appointments */}
      <div className="grid gap-6 lg:grid-cols-2">
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
            <CardTitle>Próximos Agendamentos</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              data={metrics.upcomingAppointments}
              columns={appointmentColumns}
              loading={loading}
              pagination={false}
              searchable={false}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
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
import { supabase } from '@/integrations/supabase/client';

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

      // 1. Fetch Products stats
      const { count: totalProducts } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('seller_id', user?.id);

      const { count: activeProducts } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('seller_id', user?.id)
        .eq('is_active', true);

      const { data: orderItems, error: itemsError } = await supabase
        .from('order_items')
        .select(`
          quantity,
          unit_price,
          orders (
            id,
            status,
            created_at,
            buyer_id,
            profiles:buyer_id (full_name)
          )
        `)
        .eq('seller_id', user?.id);

      if (itemsError) throw itemsError;

      // Group items by order for "Recent Orders"
      const ordersMap = new Map();
      let totalRevenue = 0;
      let monthlyRevenue = 0;
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      orderItems?.forEach(item => {
        const order = item.orders as any;
        if (!order) return;

        const amount = Number(item.unit_price) * Number(item.quantity);
        totalRevenue += amount;

        if (new Date(order.created_at) >= firstDayOfMonth) {
          monthlyRevenue += amount;
        }

        if (!ordersMap.has(order.id)) {
          ordersMap.set(order.id, {
            id: order.id,
            buyer_name: order.profiles?.full_name || 'Cliente',
            total_amount: 0,
            status: order.status,
            created_at: order.created_at
          });
        }
        ordersMap.get(order.id).total_amount += amount;
      });

      const recentOrders = Array.from(ordersMap.values())
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5);

      // 3. Fetch Appointments
      const { data: upcomingAppointments, error: apptError } = await supabase
        .from('appointments')
        .select(`
          id,
          status,
          appointment_date,
          profiles:buyer_id (full_name)
        `)
        .eq('seller_id', user?.id)
        .gte('appointment_date', new Date().toISOString())
        .order('appointment_date', { ascending: true })
        .limit(5);

      if (apptError) throw apptError;

      const { count: pendingAppointments } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('seller_id', user?.id)
        .eq('status', 'pending');

      setMetrics({
        totalProducts: totalProducts || 0,
        activeProducts: activeProducts || 0,
        totalSales: ordersMap.size,
        totalRevenue,
        monthlyRevenue,
        pendingAppointments: pendingAppointments || 0,
        recentOrders,
        upcomingAppointments: upcomingAppointments?.map(a => ({
          ...a,
          buyer_name: (a.profiles as any)?.full_name || 'Cliente'
        })) || []
      });
    } catch (error) {
      console.error('Error loading seller metrics:', error);
    } finally {
      setLoading(false);
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
      title: 'Ações',
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
      title: 'Cliente',
      render: (value: string) => value || 'N/A'
    },
    {
      key: 'appointment_date',
      title: 'Data',
      render: (value: string) => new Date(value).toLocaleDateString('pt-BR')
    },
    {
      key: 'status',
      title: 'Status',
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
      title: 'Ações',
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
            Visão geral das suas vendas e anúncios
          </p>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          title="Total de Anúncios"
          value={metrics.totalProducts}
          icon={<Package className="h-4 w-4" />}
          loading={loading}
        />
        <MetricCard
          title="Anúncios Ativos"
          value={metrics.activeProducts}
          icon={<Package className="h-4 w-4" />}
          loading={loading}
        />
        <MetricCard
          title="Total de Vendas"
          value={metrics.totalSales}
          icon={<ShoppingBag className="h-4 w-4" />}
          loading={loading}
        />
        <MetricCard
          title="Receita Total"
          value={`R$ ${metrics.totalRevenue.toLocaleString()}`}
          icon={<DollarSign className="h-4 w-4" />}
          loading={loading}
        />
        <MetricCard
          title="Receita Mensal"
          value={`R$ ${metrics.monthlyRevenue.toLocaleString()}`}
          icon={<TrendingUp className="h-4 w-4" />}
          loading={loading}
        />
        <MetricCard
          title="Agendamentos Pendentes"
          value={metrics.pendingAppointments}
          icon={<Calendar className="h-4 w-4" />}
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
              pagination={undefined}
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
              pagination={undefined}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
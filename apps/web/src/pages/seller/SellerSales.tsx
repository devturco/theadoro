import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, DataTable, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@theadoro/ui';
import { useAuth } from '@/contexts/AuthContext';
import { useRole } from '@/hooks/useRole';
import { supabase } from '@/integrations/supabase/client';
import {
  DollarSign,
  Eye,
  Filter,
  Package,
  ShoppingBag,
  TrendingUp,
} from 'lucide-react';

interface SalesStats {
  totalSales: number;
  totalRevenue: number;
  averageOrderValue: number;
  monthlyGrowth: number;
}

const APPROVED_PAYMENT_STATUSES = ['approved', 'paid', 'succeeded'];

const parseMaybeJson = (value: any, fallback: any = {}) => {
  if (!value) return fallback;
  if (typeof value !== 'string') return value;

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const deriveSaleStatus = (order: any) => {
  const notes = parseMaybeJson(order?.notes, {});
  const payments = [...(order?.payments || [])].sort(
    (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  const latestPayment = payments[0];
  const paymentStatus = latestPayment?.status || notes?.paymentInfo?.status;

  if (order?.status === 'cancelled') return 'cancelled';
  if (['confirmed', 'processing', 'shipped', 'delivered'].includes(order?.status)) return order.status;
  if (APPROVED_PAYMENT_STATUSES.includes(paymentStatus)) return 'processing';
  return order?.status || 'pending';
};

export default function SellerSales() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { hasRole } = useRole();

  const [sales, setSales] = useState<any[]>([]);
  const [stats, setStats] = useState<SalesStats>({
    totalSales: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
    monthlyGrowth: 0,
  });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const isSeller = hasRole('seller');

  useEffect(() => {
    if (user && isSeller) {
      void loadSalesData();
    }
  }, [isSeller, statusFilter, user]);

  const loadSalesData = async () => {
    try {
      setLoading(true);

      const { data: orderItems, error } = await supabase
        .from('order_items')
        .select(`
          id,
          order_id,
          unit_price,
          quantity,
          gift_message,
          products (
            id,
            name,
            images
          ),
          orders (
            id,
            status,
            created_at,
            shipping_address,
            shipping_method,
            shipping_cost,
            gift_wrap_price,
            discount_amount,
            subtotal_amount,
            total_amount,
            payment_method,
            notes,
            profiles:buyer_id (full_name, email),
            payments (
              id,
              provider,
              provider_transaction_id,
              status,
              metadata,
              created_at
            )
          )
        `)
        .eq('seller_id', user?.id)
        .order('created_at', { foreignTable: 'orders', ascending: false });

      if (error) throw error;

      const ordersMap = new Map();
      let totalRevenue = 0;
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

      let currentMonthRevenue = 0;
      let lastMonthRevenue = 0;

      orderItems?.forEach((item: any) => {
        const order = item.orders as any;
        if (!order) return;

        const amount = Number(item.unit_price) * Number(item.quantity);
        totalRevenue += amount;

        const orderDate = new Date(order.created_at);
        if (orderDate >= firstDayOfMonth) {
          currentMonthRevenue += amount;
        } else if (orderDate >= firstDayOfLastMonth) {
          lastMonthRevenue += amount;
        }

        if (!ordersMap.has(order.id)) {
          const notes = parseMaybeJson(order.notes, {});
          ordersMap.set(order.id, {
            id: order.id,
            buyer_name: order.profiles?.full_name || 'Cliente',
            buyer_email: order.profiles?.email || 'N/A',
            status: deriveSaleStatus(order),
            created_at: order.created_at,
            tracking_number:
              notes?.tracking_number ||
              notes?.trackingNumber ||
              notes?.fulfillment?.tracking_number ||
              notes?.fulfillment?.trackingNumber ||
              '',
            shipping_address: parseMaybeJson(order.shipping_address, null),
            shipping_method: order.shipping_method,
            shipping_cost: order.shipping_cost,
            gift_wrap_price: order.gift_wrap_price,
            discount_amount: order.discount_amount,
            subtotal_amount: order.subtotal_amount,
            total_amount: order.total_amount,
            payment_method: order.payment_method,
            notes: parseMaybeJson(order.notes, {}),
            payments: order.payments || [],
            items: [],
          });
        }

        const orderData = ordersMap.get(order.id);
        orderData.items.push({
          id: item.id,
          product_name: item.products?.name || 'Produto',
          product_image: item.products?.images?.[0],
          quantity: item.quantity,
          price: item.unit_price,
          gift_message: item.gift_message,
        });
      });

      const processedSales = Array.from(ordersMap.values()).sort(
        (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      const monthlyGrowth = lastMonthRevenue > 0
        ? Number((((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100).toFixed(1))
        : 0;

      setSales(processedSales);
      setStats({
        totalSales: ordersMap.size,
        totalRevenue,
        averageOrderValue: ordersMap.size > 0 ? totalRevenue / ordersMap.size : 0,
        monthlyGrowth,
      });
    } catch (error) {
      console.error('Error loading sales data:', error);
    } finally {
      setLoading(false);
    }
  };

  const salesColumns = [
    {
      key: 'id',
      title: 'ID',
      render: (value: string) => `#${value.slice(0, 8)}`,
    },
    {
      key: 'buyer_name',
      title: 'Cliente',
      render: (value: string) => value || 'N/A',
    },
    {
      key: 'buyer_email',
      title: 'Email',
      render: (value: string) => value || 'N/A',
    },
    {
      key: 'total_amount',
      title: 'Total',
      render: (value: number) => `R$ ${value?.toFixed(2) || '0.00'}`,
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
          cancelled: { label: 'Cancelado', variant: 'destructive' as const },
        };
        const status = statusMap[value as keyof typeof statusMap] || statusMap.pending;
        return <Badge variant={status.variant}>{status.label}</Badge>;
      },
    },
    {
      key: 'created_at',
      title: 'Data',
      render: (value: string) => new Date(value).toLocaleDateString('pt-BR'),
    },
    {
      key: 'actions',
      title: 'Ações',
      render: (_: any, row: any) => (
        <Button variant="outline" size="sm" onClick={() => navigate(`/seller/sales/${row.id}`)}>
          <Eye className="mr-1 h-4 w-4" />
          Ver
        </Button>
      ),
    },
  ];

  const filteredSales = sales.filter((sale) => {
    const matchesStatus = statusFilter === 'all' || sale.status === statusFilter;
    const matchesSearch = sale.buyer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.buyer_email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

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
          <h1 className="text-3xl font-bold">Minhas Vendas</h1>
          <p className="text-muted-foreground">Gerencie e acompanhe suas vendas</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Vendas</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSales}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {stats.totalRevenue.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {stats.averageOrderValue.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Crescimento Mensal</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{stats.monthlyGrowth}%</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="search">Buscar por cliente</Label>
              <Input
                id="search"
                placeholder="Nome ou email do cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="confirmed">Confirmado</SelectItem>
                  <SelectItem value="processing">Processando</SelectItem>
                  <SelectItem value="shipped">Enviado</SelectItem>
                  <SelectItem value="delivered">Entregue</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Vendas</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable data={filteredSales} columns={salesColumns} loading={loading} />
        </CardContent>
      </Card>
    </div>
  );
}

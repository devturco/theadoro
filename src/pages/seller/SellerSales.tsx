import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { useRole } from '@/hooks/useRole';
import { useCRUD } from '@/hooks/useCRUD';
import {
  ShoppingBag,
  DollarSign,
  TrendingUp,
  Package,
  Eye,
  Filter,
  MapPin,
  CreditCard,
  Gift,
  Truck,
  Clock,
  CheckCircle,
  ArrowRight
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface SalesStats {
  totalSales: number;
  totalRevenue: number;
  averageOrderValue: number;
  monthlyGrowth: number;
}

export default function SellerSales() {
  const { user } = useAuth();
  const { hasRole } = useRole();
  const [sales, setSales] = useState<any[]>([]);
  const [stats, setStats] = useState<SalesStats>({
    totalSales: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
    monthlyGrowth: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const isSeller = hasRole('seller');

  useEffect(() => {
    if (user && isSeller) {
      loadSalesData();
    }
  }, [user, isSeller, statusFilter]);

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
            buyer_id,
            shipping_address,
            shipping_method,
            shipping_cost,
            gift_wrap_price,
            discount_amount,
            subtotal_amount,
            total_amount,
            payment_method,
            notes,
            profiles:buyer_id (full_name, email)
          )
        `)
        .eq('seller_id', user?.id)
        .order('created_at', { foreignTable: 'orders', ascending: false });

      if (error) throw error;

      // Group items by order
      const ordersMap = new Map();
      let totalRevenue = 0;
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

      let currentMonthRevenue = 0;
      let lastMonthRevenue = 0;

      orderItems?.forEach(item => {
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
          ordersMap.set(order.id, {
            id: order.id,
            buyer_name: order.profiles?.full_name || 'Cliente',
            buyer_email: order.profiles?.email || 'N/A',
            total_amount: 0,
            status: order.status,
            created_at: order.created_at,
            shipping_address: typeof order.shipping_address === 'string' ? JSON.parse(order.shipping_address) : order.shipping_address,
            shipping_method: order.shipping_method,
            shipping_cost: order.shipping_cost,
            gift_wrap_price: order.gift_wrap_price,
            discount_amount: order.discount_amount,
            subtotal_amount: order.subtotal_amount,
            total_amount: order.total_amount,
            payment_method: order.payment_method,
            notes: typeof order.notes === 'string' ? JSON.parse(order.notes) : order.notes,
            items: []
          });
        }

        const orderData = ordersMap.get(order.id);
        // We don't sum item prices into total_amount here because total_amount 
        // from the orders table is the definitive total including shipping/gift/discount.
        orderData.items.push({
          id: item.id,
          product_name: (item.products as any)?.name || 'Produto',
          product_image: (item.products as any)?.images?.[0],
          quantity: item.quantity,
          price: item.unit_price,
          gift_message: item.gift_message
        });
      });

      const processedSales = Array.from(ordersMap.values())
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      // Calculate growth
      let monthlyGrowth = 0;
      if (lastMonthRevenue > 0) {
        monthlyGrowth = ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100;
      }

      setSales(processedSales);
      setStats({
        totalSales: ordersMap.size,
        totalRevenue,
        averageOrderValue: ordersMap.size > 0 ? totalRevenue / ordersMap.size : 0,
        monthlyGrowth: Number(monthlyGrowth.toFixed(1))
      });
    } catch (error) {
      console.error('Error loading sales data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewOrder = (order: any) => {
    setSelectedOrder(order);
    setIsDetailsOpen(true);
  };

  const salesColumns = [
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
      key: 'buyer_email',
      title: 'Email',
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
      key: 'created_at',
      title: 'Data',
      render: (value: string) => new Date(value).toLocaleDateString('pt-BR')
    },
    {
      key: 'actions',
      title: 'Ações',
      render: (_: any, row: any) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleViewOrder(row)}
        >
          <Eye className="h-4 w-4 mr-1" />
          Ver
        </Button>
      )
    }
  ];

  const filteredSales = sales.filter(sale => {
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
          <p className="text-muted-foreground">
            Gerencie e acompanhe suas vendas
          </p>
        </div>
      </div>

      {/* Stats Cards */}
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

      {/* Filters */}
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

      {/* Sales Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Vendas</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={filteredSales}
            columns={salesColumns}
            loading={loading}
          />
        </CardContent>
      </Card>

      {/* Order Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da Venda #{selectedOrder?.id.slice(0, 8)}</DialogTitle>
            <DialogDescription>
              Informações completas da venda
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6">
              {/* Timeline Simplificado */}
              <div className="flex justify-between items-center px-2 py-4 border-b">
                {[
                  { label: 'Pendente', status: 'pending', icon: Clock },
                  { label: 'Confirmado', status: 'confirmed', icon: CheckCircle },
                  { label: 'Enviado', status: 'shipped', icon: Truck },
                  { label: 'Entregue', status: 'delivered', icon: Package },
                ].map((step, idx) => {
                  const isCompleted = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'].indexOf(selectedOrder.status) >= idx;
                  const Icon = step.icon;
                  return (
                    <div key={idx} className="flex flex-col items-center gap-1">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${isCompleted ? 'bg-primary border-primary text-white' : 'bg-gray-50 border-gray-200 text-gray-400'}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className={`text-[10px] font-medium ${isCompleted ? 'text-primary' : 'text-gray-400'}`}>{step.label}</span>
                    </div>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 1. Produtos */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold flex items-center gap-2 mb-3">
                    <Package className="h-4 w-4 text-primary" /> Produtos
                  </h3>
                  <div className="space-y-3">
                    {selectedOrder.items?.map((item: any) => (
                      <div key={item.id} className="flex gap-3 p-3 border rounded-lg bg-gray-50/50">
                        <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                          <img
                            src={item.product_image || 'https://via.placeholder.com/150'}
                            alt={item.product_name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">{item.product_name}</p>
                          <p className="text-xs text-muted-foreground">Qtd: {item.quantity} • R$ {item.price.toFixed(2)}</p>
                          {item.gift_message && (
                            <div className="mt-2 text-[10px] bg-amber-50 text-amber-900 p-1.5 rounded flex items-center gap-1.5 italic">
                              <Gift className="h-3 w-3" />
                              "{item.gift_message}"
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. Entrega */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold flex items-center gap-2 mb-3">
                    <MapPin className="h-4 w-4 text-primary" /> Entrega
                  </h3>
                  <div className="p-3 border rounded-lg bg-gray-50/50 text-xs space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold">{selectedOrder.notes?.customer?.firstName} {selectedOrder.notes?.customer?.lastName || selectedOrder.buyer_name}</p>
                        {selectedOrder.shipping_address ? (
                          <div className="text-muted-foreground mt-1 space-y-0.5">
                            <p>{selectedOrder.shipping_address.street || selectedOrder.shipping_address.address}, {selectedOrder.shipping_address.number}</p>
                            <p>{selectedOrder.shipping_address.neighborhood}</p>
                            <p>{selectedOrder.shipping_address.city} - {selectedOrder.shipping_address.state}</p>
                            <p>{selectedOrder.shipping_address.zipCode}</p>
                          </div>
                        ) : (
                          <p className="italic text-muted-foreground mt-1">Endereço não disponível</p>
                        )}
                      </div>
                    </div>

                    {selectedOrder.shipping_method && (
                      <div className="pt-2 border-t flex items-center gap-2 text-primary font-medium">
                        <Truck className="h-3.5 w-3.5" />
                        {selectedOrder.shipping_method}
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Presente */}
                {selectedOrder.notes?.giftOptions?.is_gift ? (
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold flex items-center gap-2 mb-3">
                      <Gift className="h-4 w-4 text-primary" /> Opções de Presente
                    </h3>
                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                      <div className="flex gap-3 mb-3">
                        {selectedOrder.notes?.giftOptions?.wrap_style_image && (
                          <div className="w-12 h-12 rounded overflow-hidden border bg-white flex-shrink-0">
                            <img
                              src={selectedOrder.notes.giftOptions.wrap_style_image}
                              alt={selectedOrder.notes.giftOptions.wrap_style_name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="text-xs space-y-1">
                            <div className="flex justify-between">
                              <span className="text-purple-700">Embalagem:</span>
                              <span className="font-medium text-purple-900">{selectedOrder.notes?.giftOptions?.wrap_style_name || 'Sim'}</span>
                            </div>
                            {selectedOrder.notes?.giftOptions?.recipient_name && (
                              <div className="flex justify-between">
                                <span className="text-purple-700">Para:</span>
                                <span className="font-medium text-purple-900">{selectedOrder.notes?.giftOptions.recipient_name}</span>
                              </div>
                            )}
                            {selectedOrder.notes?.giftOptions?.sender_name && (
                              <div className="flex justify-between">
                                <span className="text-purple-700">De:</span>
                                <span className="font-medium text-purple-900">{selectedOrder.notes?.giftOptions.sender_name}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      {selectedOrder.notes?.giftOptions?.message && (
                        <div className="mt-2 bg-white/50 p-2 rounded border border-purple-100 italic text-[11px] text-purple-900">
                          "{selectedOrder.notes?.giftOptions.message}"
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="hidden md:block" /> // Empty cell for grid symmetry
                )}

                {/* 4. Pagamento */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold flex items-center gap-2 mb-3">
                    <CreditCard className="h-4 w-4 text-primary" /> Pagamento
                  </h3>
                  <div className="p-3 border rounded-lg space-y-2 text-xs">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Produtos</span>
                      <span>R$ {(selectedOrder.subtotal_amount || (selectedOrder.total_amount - (selectedOrder.shipping_cost || 0) - (selectedOrder.gift_wrap_price || 0) + (selectedOrder.discount_amount || 0))).toFixed(2)}</span>
                    </div>
                    {selectedOrder.gift_wrap_price > 0 && (
                      <div className="flex justify-between text-muted-foreground">
                        <span>Embalagem</span>
                        <span>R$ {selectedOrder.gift_wrap_price.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-muted-foreground">
                      <span>Frete</span>
                      <span>R$ {(selectedOrder.shipping_cost || 0).toFixed(2)}</span>
                    </div>
                    {selectedOrder.discount_amount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Desconto</span>
                        <span>-R$ {selectedOrder.discount_amount.toFixed(2)}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between font-bold text-sm text-primary">
                      <span>Total</span>
                      <span>R$ {selectedOrder.total_amount.toFixed(2)}</span>
                    </div>
                    <div className="pt-2 flex items-center gap-2 text-[10px] text-muted-foreground uppercase">
                      <CreditCard className="h-3 w-3" />
                      Pago via {selectedOrder.payment_method?.replace('_', ' ')}
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4 flex justify-end gap-3">
                <Button variant="outline" size="sm" onClick={() => setIsDetailsOpen(false)}>
                  Fechar
                </Button>
                <Button size="sm">
                  Imprimir Comprovante
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
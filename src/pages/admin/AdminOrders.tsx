import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useRole } from '@/hooks/useRole';
import { useOrders } from '@/hooks/useOrders';
import {
  ShoppingCart,
  Eye,
  Edit,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Calendar,
  User,
  Gift,
  Download,
  Printer
} from 'lucide-react';
import { toast } from 'sonner';
import { Order, OrderStatus } from '@/types/order';

const AdminOrders = () => {
  const { user } = useAuth();
  const { isAdmin } = useRole();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');

  const {
    orders,
    loading,
    updateOrderStatus,
    getOrderStats,
    refetch
  } = useOrders();

  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    confirmed: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
    totalRevenue: 0
  });

  useEffect(() => {
    if (!isAdmin) {
      toast.error('Acesso negado. Apenas administradores podem acessar esta página.');
      return;
    }

    calculateStats();
  }, [isAdmin, orders]);

  const calculateStats = () => {
    if (!orders) return;

    const stats = {
      total: orders.length,
      pending: orders.filter(o => o.status === 'pending').length,
      confirmed: orders.filter(o => o.status === 'confirmed').length,
      shipped: orders.filter(o => o.status === 'shipped').length,
      delivered: orders.filter(o => o.status === 'delivered').length,
      cancelled: orders.filter(o => o.status === 'cancelled').length,
      totalRevenue: orders.reduce((sum, order) => sum + order.total_amount, 0)
    };

    setStats(stats);
  };

  const handleStatusUpdate = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      toast.success('Status do pedido atualizado com sucesso!');
      refetch();
      calculateStats();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar status do pedido');
    }
  };

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setIsDetailsOpen(true);
  };

  const getStatusBadge = (status: OrderStatus) => {
    const variants = {
      pending: 'secondary',
      confirmed: 'default',
      shipped: 'default',
      delivered: 'default',
      cancelled: 'destructive'
    } as const;

    const labels = {
      pending: 'Pendente',
      confirmed: 'Confirmado',
      shipped: 'Enviado',
      delivered: 'Entregue',
      cancelled: 'Cancelado'
    };

    return (
      <Badge variant={variants[status]}>
        {labels[status]}
      </Badge>
    );
  };

  const getStatusIcon = (status: OrderStatus) => {
    const icons = {
      pending: Clock,
      confirmed: CheckCircle,
      shipped: Truck,
      delivered: Package,
      cancelled: XCircle
    };

    const Icon = icons[status];
    return <Icon className="h-4 w-4" />;
  };

  const filteredOrders = statusFilter === 'all'
    ? orders
    : orders?.filter(order => order.status === statusFilter);

  const columns = [
    {
      key: 'id',
      label: 'ID',
      render: (value: string) => `#${value.slice(0, 8)}`
    },
    {
      key: 'buyer',
      label: 'Cliente',
      render: (_: any, row: Order) => row.buyer?.name || 'N/A'
    },
    {
      key: 'items_count',
      label: 'Itens',
      render: (_: any, row: Order) => row.items?.length || 0
    },
    {
      key: 'total_amount',
      label: 'Total',
      render: (value: number) => `R$ ${value.toFixed(2)}`
    },
    {
      key: 'status',
      label: 'Status',
      render: (status: OrderStatus) => getStatusBadge(status)
    },
    {
      key: 'created_at',
      label: 'Data do Pedido',
      render: (value: string) => new Date(value).toLocaleDateString('pt-BR')
    },
    {
      key: 'actions',
      label: 'Ações',
      render: (_: any, row: Order) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleViewDetails(row)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Select
            value={row.status}
            onValueChange={(value: OrderStatus) => handleStatusUpdate(row.id, value)}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="confirmed">Confirmado</SelectItem>
              <SelectItem value="shipped">Enviado</SelectItem>
              <SelectItem value="delivered">Entregue</SelectItem>
              <SelectItem value="cancelled">Cancelado</SelectItem>
            </SelectContent>
          </Select>
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
        <div>
          <h1 className="text-3xl font-bold">Gerenciar Pedidos</h1>
          <p className="text-muted-foreground">
            Acompanhe e gerencie todos os pedidos da plataforma
          </p>
        </div>
      </div>

      {/* Métricas de pedidos */}
      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confirmados</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.confirmed}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Enviados</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.shipped}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entregues</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.delivered}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cancelados</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.cancelled}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {stats.totalRevenue.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="grid gap-2">
              <Label>Status</Label>
              <Select
                value={statusFilter}
                onValueChange={(value: OrderStatus | 'all') => setStatusFilter(value)}
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Pendentes</SelectItem>
                  <SelectItem value="confirmed">Confirmados</SelectItem>
                  <SelectItem value="shipped">Enviados</SelectItem>
                  <SelectItem value="delivered">Entregues</SelectItem>
                  <SelectItem value="cancelled">Cancelados</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de pedidos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Lista de Pedidos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={filteredOrders || []}
            columns={columns}
            loading={loading}
            searchable={true}
            searchPlaceholder="Buscar pedidos..."
          />
        </CardContent>
      </Card>

      {/* Dialog de detalhes do pedido */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Pedido #{selectedOrder?.id.slice(0, 8)}</DialogTitle>
            <DialogDescription>
              Informações completas do pedido
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (() => {
            // Parse JSON fields safely
            const notes = selectedOrder.notes ? (typeof selectedOrder.notes === 'string' ? JSON.parse(selectedOrder.notes) : selectedOrder.notes) : {};
            const shippingAddress = selectedOrder.shipping_address ? (typeof selectedOrder.shipping_address === 'string' ? JSON.parse(selectedOrder.shipping_address) : selectedOrder.shipping_address) : null;

            // Safe accessors
            const giftOptions = notes.giftOptions;
            const deliverySchedule = notes.deliverySchedule;
            const paymentInfo = notes.paymentInfo;

            return (
              <div className="space-y-6">
                {/* Status Bar */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-gray-500">Status atual:</span>
                    {getStatusBadge(selectedOrder.status)}
                  </div>
                  <div className="text-sm text-gray-500">
                    Realizado em {new Date(selectedOrder.created_at).toLocaleString('pt-BR')}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Coluna Esquerda: Cliente e Entrega */}
                  <div className="space-y-6">
                    <div>
                      <h3 className="flex items-center gap-2 font-semibold mb-3">
                        <User className="h-4 w-4" /> Cliente
                      </h3>
                      <div className="bg-white border rounded-lg p-3 text-sm space-y-1">
                        <p><span className="font-medium">Nome:</span> {notes.customer?.firstName} {notes.customer?.lastName} ({selectedOrder.buyer?.name})</p>
                        <p><span className="font-medium">Email:</span> {selectedOrder.buyer?.email}</p>
                        <p><span className="font-medium">Telefone:</span> {notes.customer?.phone}</p>
                      </div>
                    </div>

                    <div>
                      <h3 className="flex items-center gap-2 font-semibold mb-3">
                        <Truck className="h-4 w-4" /> Entrega
                      </h3>
                      <div className="bg-white border rounded-lg p-3 text-sm space-y-1">
                        {shippingAddress ? (
                          <>
                            <p>{shippingAddress.address}</p>
                            <p>{shippingAddress.neighborhood} - {shippingAddress.city}/{shippingAddress.state}</p>
                            <p>CEP: {shippingAddress.zipCode}</p>
                            <p>{shippingAddress.country}</p>
                          </>
                        ) : (
                          <p className="text-muted-foreground">Endereço não disponível</p>
                        )}

                        {deliverySchedule && (
                          <div className="mt-3 pt-3 border-t">
                            <p className="font-medium flex items-center gap-2 text-blue-600">
                              <Calendar className="h-3 w-3" /> Agendamento
                            </p>
                            <p>Data: {new Date(deliverySchedule.scheduled_date).toLocaleDateString('pt-BR')}</p>
                            <p>Período: {deliverySchedule.scheduled_slot === 'morning' ? 'Manhã' : deliverySchedule.scheduled_slot === 'afternoon' ? 'Tarde' : 'Comercial'}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Coluna Direita: Pagamento e Presente */}
                  <div className="space-y-6">
                    <div>
                      <h3 className="flex items-center gap-2 font-semibold mb-3">
                        <DollarSign className="h-4 w-4" /> Pagamento
                      </h3>
                      <div className="bg-white border rounded-lg p-3 text-sm space-y-2">
                        <p className="capitalize"><span className="font-medium">Método:</span> {selectedOrder.payment_method?.replace('_', ' ')}</p>
                        <p><span className="font-medium">Total:</span> R$ {selectedOrder.total_amount.toFixed(2)}</p>

                        {paymentInfo && (
                          <div className="bg-gray-50 p-2 rounded text-xs">
                            <p>Transaction ID: {paymentInfo.id}</p>
                            {paymentInfo.pixCode && (
                              <div className="mt-1 break-all">
                                <span className="font-semibold">PIX Code:</span> {paymentInfo.pixCode.slice(0, 20)}...
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {giftOptions && giftOptions.is_gift && (
                      <div>
                        <h3 className="flex items-center gap-2 font-semibold mb-3 text-purple-600">
                          <Gift className="h-4 w-4" /> Opções de Presente
                        </h3>
                        <div className="bg-purple-50 border border-purple-100 rounded-lg p-3 text-sm space-y-2">
                          <p>🎁 <strong>Pedido para Presente</strong></p>
                          {giftOptions.message && (
                            <div className="italic text-gray-600">
                              "{giftOptions.message}"
                            </div>
                          )}
                          <div className="text-xs text-gray-500 mt-2">
                            <p>De: {giftOptions.sender_name || 'Anônimo'}</p>
                            <p>Para: {giftOptions.recipient_name || 'Destinatário'}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Itens do pedido */}
                <div>
                  <h3 className="font-semibold mb-3">Itens do Pedido</h3>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                    {selectedOrder.items?.map((item, index) => (
                      <div key={index} className="flex justify-between items-center p-3 border rounded-lg bg-white">
                        <div className="flex gap-3 items-center">
                          <div className="h-10 w-10 bg-gray-100 rounded flex items-center justify-center">
                            <Package className="h-5 w-5 text-gray-400" />
                          </div>
                          <div>
                            <div className="font-medium">{item.product?.name || 'Produto'}</div>
                            <div className="text-sm text-muted-foreground">
                              {item.quantity}un x R$ {item.unit_price.toFixed(2)}
                            </div>
                          </div>
                        </div>
                        <div className="font-medium">
                          R$ {(item.quantity * item.unit_price).toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            );
          })()}

          <DialogFooter className="sm:justify-between">
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" /> Nota Fiscal
              </Button>
              <Button variant="outline" size="sm">
                <Printer className="h-4 w-4 mr-2" /> Imprimir
              </Button>
            </div>
            <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminOrders;
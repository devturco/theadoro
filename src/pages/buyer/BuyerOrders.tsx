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
import { useAuth } from '@/contexts/AuthContext';
import { useRole } from '@/hooks/useRole';
import { useCRUD } from '@/hooks/useCRUD';
import { 
  ShoppingCart, 
  Package, 
  Truck, 
  CheckCircle,
  XCircle,
  Eye,
  Filter,
  Star
} from 'lucide-react';

interface OrderStats {
  total: number;
  pending: number;
  confirmed: number;
  shipped: number;
  delivered: number;
  cancelled: number;
}

export default function BuyerOrders() {
  const { user } = useAuth();
  const { hasRole } = useRole();
  const [orders, setOrders] = useState<any[]>([]);
  const [stats, setStats] = useState<OrderStats>({
    total: 0,
    pending: 0,
    confirmed: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const isBuyer = hasRole('buyer');

  useEffect(() => {
    if (user && isBuyer) {
      loadOrders();
    }
  }, [user, isBuyer, statusFilter]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      
      // Mock data - replace with actual API calls
      const mockOrders = [
        {
          id: '1',
          seller_name: 'Artesanatos Maria',
          seller_email: 'maria@artesanatos.com',
          total_amount: 299.90,
          status: 'delivered',
          created_at: '2024-01-15T10:30:00Z',
          delivery_date: '2024-01-20T14:00:00Z',
          tracking_code: 'BR123456789',
          items: [
            { product_name: 'Colar Personalizado', quantity: 1, price: 299.90 }
          ]
        },
        {
          id: '2',
          seller_name: 'Joias Premium',
          seller_email: 'contato@joiaspremium.com',
          total_amount: 150.00,
          status: 'shipped',
          created_at: '2024-01-14T14:20:00Z',
          tracking_code: 'BR987654321',
          items: [
            { product_name: 'Pulseira Artesanal', quantity: 2, price: 75.00 }
          ]
        },
        {
          id: '3',
          seller_name: 'Presentes Especiais',
          seller_email: 'vendas@presentesespeciais.com',
          total_amount: 450.00,
          status: 'confirmed',
          created_at: '2024-01-13T09:15:00Z',
          items: [
            { product_name: 'Kit Presente Especial', quantity: 1, price: 450.00 }
          ]
        }
      ];

      const mockStats: OrderStats = {
        total: mockOrders.length,
        pending: mockOrders.filter(o => o.status === 'pending').length,
        confirmed: mockOrders.filter(o => o.status === 'confirmed').length,
        shipped: mockOrders.filter(o => o.status === 'shipped').length,
        delivered: mockOrders.filter(o => o.status === 'delivered').length,
        cancelled: mockOrders.filter(o => o.status === 'cancelled').length
      };

      setOrders(mockOrders);
      setStats(mockStats);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewOrder = (order: any) => {
    setSelectedOrder(order);
    setIsDetailsOpen(true);
  };

  const handleCancelOrder = async (orderId: string) => {
    try {
      // Cancel order - replace with actual API call
      setOrders(prev => 
        prev.map(order => 
          order.id === orderId 
            ? { ...order, status: 'cancelled' }
            : order
        )
      );
      
      // Reload stats
      loadOrders();
    } catch (error) {
      console.error('Error cancelling order:', error);
    }
  };

  const orderColumns = [
    {
      key: 'id',
      label: 'ID',
      render: (value: string) => `#${value.slice(0, 8)}`
    },
    {
      key: 'seller_name',
      label: 'Vendedor',
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
      key: 'created_at',
      label: 'Data',
      render: (value: string) => new Date(value).toLocaleDateString('pt-BR')
    },
    {
      key: 'actions',
      label: 'Ações',
      render: (_: any, row: any) => (
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => handleViewOrder(row)}
          >
            <Eye className="h-4 w-4 mr-1" />
            Ver
          </Button>
          {row.status === 'pending' && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleCancelOrder(row.id)}
            >
              <XCircle className="h-4 w-4 mr-1" />
              Cancelar
            </Button>
          )}
          {row.status === 'delivered' && (
            <Button 
              variant="outline" 
              size="sm"
            >
              <Star className="h-4 w-4 mr-1" />
              Avaliar
            </Button>
          )}
        </div>
      )
    }
  ];

  const filteredOrders = orders.filter(order => {
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesSearch = order.seller_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
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
          <h1 className="text-3xl font-bold">Meus Pedidos</h1>
          <p className="text-muted-foreground">
            Acompanhe o status dos seus pedidos
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
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
            <Package className="h-4 w-4 text-muted-foreground" />
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
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
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
              <Label htmlFor="search">Buscar pedido</Label>
              <Input
                id="search"
                placeholder="ID do pedido ou nome do vendedor..."
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

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Pedidos</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={filteredOrders}
            columns={orderColumns}
            loading={loading}
            searchable={false}
          />
        </CardContent>
      </Card>

      {/* Order Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Pedido #{selectedOrder?.id.slice(0, 8)}</DialogTitle>
            <DialogDescription>
              Informações completas do pedido
            </DialogDescription>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label className="text-sm font-medium">Vendedor</Label>
                  <p className="text-sm text-muted-foreground">{selectedOrder.seller_name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Email do Vendedor</Label>
                  <p className="text-sm text-muted-foreground">{selectedOrder.seller_email}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <Badge className="mt-1">
                    {selectedOrder.status === 'delivered' ? 'Entregue' : 
                     selectedOrder.status === 'shipped' ? 'Enviado' : 
                     selectedOrder.status === 'confirmed' ? 'Confirmado' : 'Pendente'}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium">Data do Pedido</Label>
                  <p className="text-sm text-muted-foreground">
                    {new Date(selectedOrder.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                {selectedOrder.tracking_code && (
                  <div>
                    <Label className="text-sm font-medium">Código de Rastreamento</Label>
                    <p className="text-sm text-muted-foreground">{selectedOrder.tracking_code}</p>
                  </div>
                )}
                {selectedOrder.delivery_date && (
                  <div>
                    <Label className="text-sm font-medium">Data de Entrega</Label>
                    <p className="text-sm text-muted-foreground">
                      {new Date(selectedOrder.delivery_date).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                )}
              </div>
              
              <div>
                <Label className="text-sm font-medium">Itens</Label>
                <div className="mt-2 space-y-2">
                  {selectedOrder.items?.map((item: any, index: number) => (
                    <div key={index} className="flex justify-between items-center p-2 border rounded">
                      <div>
                        <p className="font-medium">{item.product_name}</p>
                        <p className="text-sm text-muted-foreground">Quantidade: {item.quantity}</p>
                      </div>
                      <p className="font-medium">R$ {item.price.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total:</span>
                  <span className="text-lg font-bold">R$ {selectedOrder.total_amount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useRole } from '@/hooks/useRole';
import { useOrders } from '@/hooks/useOrders';
import { OrderStatus, Order } from '@/types/order';
import { useNavigate } from 'react-router-dom';
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
import { toast } from 'sonner';

export default function BuyerOrders() {
  const { user } = useAuth();
  const { hasRole } = useRole();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const isBuyer = hasRole('buyer');

  const {
    orders,
    loading,
    stats,
    updateOrderStatus,
    fetchStats,
    filterByStatus,
    searchOrders,
    pagination
  } = useOrders({
    scope: 'buyer',
    fetchOnMount: true
  });

  useEffect(() => {
    if (user && isBuyer) {
      fetchStats();
    }
  }, [user, isBuyer, fetchStats]);

  const handleDisplayStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    filterByStatus(value === 'all' ? 'all' : value as OrderStatus);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    searchOrders(value);
  };

  const handleViewOrder = (order: any) => {
    navigate(`/buyer/orders/${order.id}`);
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm('Tem certeza que deseja cancelar este pedido?')) return;

    try {
      await updateOrderStatus(orderId, 'cancelled');
      fetchStats(); // Update stats after cancellation
    } catch (error) {
      // Error handled in hook
    }
  };

  const orderColumns = [
    {
      key: 'id',
      title: 'ID',
      render: (value: string) => `#${value.slice(0, 8)}`
    },
    {
      key: 'seller',
      title: 'Vendedor',
      render: (_: any, row: Order) => row.seller?.full_name || row.seller?.email || 'Vendedor'
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
          cancelled: { label: 'Cancelado', variant: 'destructive' as const },
          refunded: { label: 'Reembolsado', variant: 'destructive' as const }
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
      render: (_: any, row: Order) => (
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
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
            <div className="text-2xl font-bold">{stats?.total_orders || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pending_orders || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confirmados</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.confirmed_orders || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Enviados</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.shipped_orders || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entregues</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.delivered_orders || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cancelados</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.cancelled_orders || 0}</div>
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
                onChange={(e) => handleSearchChange(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={handleDisplayStatusFilterChange}>
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
            data={orders}
            columns={orderColumns}
            loading={loading}
            pagination={{
              page: pagination.page,
              pageSize: pagination.pageSize,
              total: pagination.totalCount,
              totalPages: pagination.totalPages
            }}
            onPageChange={pagination.setPage}
          />
        </CardContent>
      </Card>

    </div>
  );
}
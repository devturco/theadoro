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
  ShoppingBag, 
  DollarSign, 
  TrendingUp, 
  Package,
  Eye,
  Filter
} from 'lucide-react';

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
      
      // Mock data - replace with actual API calls
      const mockSales = [
        {
          id: '1',
          buyer_name: 'Maria Silva',
          buyer_email: 'maria@email.com',
          total_amount: 299.90,
          status: 'delivered',
          created_at: '2024-01-15T10:30:00Z',
          items: [
            { product_name: 'Colar Personalizado', quantity: 1, price: 299.90 }
          ]
        },
        {
          id: '2',
          buyer_name: 'João Santos',
          buyer_email: 'joao@email.com',
          total_amount: 150.00,
          status: 'confirmed',
          created_at: '2024-01-14T14:20:00Z',
          items: [
            { product_name: 'Pulseira Artesanal', quantity: 2, price: 75.00 }
          ]
        },
        {
          id: '3',
          buyer_name: 'Ana Costa',
          buyer_email: 'ana@email.com',
          total_amount: 450.00,
          status: 'shipped',
          created_at: '2024-01-13T09:15:00Z',
          items: [
            { product_name: 'Kit Presente Especial', quantity: 1, price: 450.00 }
          ]
        }
      ];

      const mockStats: SalesStats = {
        totalSales: mockSales.length,
        totalRevenue: mockSales.reduce((sum, sale) => sum + sale.total_amount, 0),
        averageOrderValue: mockSales.reduce((sum, sale) => sum + sale.total_amount, 0) / mockSales.length,
        monthlyGrowth: 15.5
      };

      setSales(mockSales);
      setStats(mockStats);
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
      label: 'ID',
      render: (value: string) => `#${value.slice(0, 8)}`
    },
    {
      key: 'buyer_name',
      label: 'Cliente',
      render: (value: string) => value || 'N/A'
    },
    {
      key: 'buyer_email',
      label: 'Email',
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
            searchable={false}
          />
        </CardContent>
      </Card>

      {/* Order Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da Venda #{selectedOrder?.id.slice(0, 8)}</DialogTitle>
            <DialogDescription>
              Informações completas da venda
            </DialogDescription>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label className="text-sm font-medium">Cliente</Label>
                  <p className="text-sm text-muted-foreground">{selectedOrder.buyer_name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Email</Label>
                  <p className="text-sm text-muted-foreground">{selectedOrder.buyer_email}</p>
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
                  <Label className="text-sm font-medium">Data</Label>
                  <p className="text-sm text-muted-foreground">
                    {new Date(selectedOrder.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
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
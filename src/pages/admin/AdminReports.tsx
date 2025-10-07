import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MetricCard } from '@/components/ui/metric-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { useCRUD } from '@/hooks/useCRUD';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Users, 
  Package,
  ShoppingCart,
  DollarSign,
  Calendar,
  Download,
  Eye,
  Star
} from 'lucide-react';
import { toast } from 'sonner';

interface ReportData {
  salesByMonth: { month: string; sales: number; revenue: number }[];
  topProducts: { name: string; sales: number; revenue: number }[];
  topSellers: { name: string; sales: number; revenue: number }[];
  userGrowth: { month: string; users: number }[];
  categoryPerformance: { category: string; products: number; sales: number }[];
}

const AdminReports = () => {
  const { user } = useAuth();
  const { isAdmin } = useRole();
  const [selectedPeriod, setSelectedPeriod] = useState('30');
  const [reportData, setReportData] = useState<ReportData>({
    salesByMonth: [],
    topProducts: [],
    topSellers: [],
    userGrowth: [],
    categoryPerformance: []
  });
  const [loading, setLoading] = useState(true);

  const { data: orders } = useCRUD('orders');
  const { data: products } = useCRUD('products');
  const { data: users } = useCRUD('users');
  const { data: categories } = useCRUD('categories');

  useEffect(() => {
    if (!isAdmin) {
      toast.error('Acesso negado. Apenas administradores podem acessar esta página.');
      return;
    }
    
    generateReports();
  }, [isAdmin, orders, products, users, categories, selectedPeriod]);

  const generateReports = async () => {
    try {
      setLoading(true);
      
      // Simulated report data generation
      // In a real app, this would be calculated from actual data
      
      const salesByMonth = [
        { month: 'Jan', sales: 45, revenue: 12500 },
        { month: 'Fev', sales: 52, revenue: 15200 },
        { month: 'Mar', sales: 48, revenue: 13800 },
        { month: 'Abr', sales: 61, revenue: 18900 },
        { month: 'Mai', sales: 55, revenue: 16700 },
        { month: 'Jun', sales: 67, revenue: 21300 }
      ];

      const topProducts = products?.slice(0, 5).map((product: any, index: number) => ({
        name: product.name,
        sales: Math.floor(Math.random() * 50) + 10,
        revenue: Math.floor(Math.random() * 5000) + 1000
      })) || [];

      const topSellers = users?.filter((user: any) => 
        user.roles?.some((role: any) => role.role === 'seller')
      ).slice(0, 5).map((seller: any, index: number) => ({
        name: seller.name || seller.email,
        sales: Math.floor(Math.random() * 30) + 5,
        revenue: Math.floor(Math.random() * 3000) + 500
      })) || [];

      const userGrowth = [
        { month: 'Jan', users: 120 },
        { month: 'Fev', users: 145 },
        { month: 'Mar', users: 162 },
        { month: 'Abr', users: 189 },
        { month: 'Mai', users: 205 },
        { month: 'Jun', users: 234 }
      ];

      const categoryPerformance = categories?.map((category: any) => ({
        category: category.name,
        products: Math.floor(Math.random() * 20) + 5,
        sales: Math.floor(Math.random() * 100) + 10
      })) || [];

      setReportData({
        salesByMonth,
        topProducts,
        topSellers,
        userGrowth,
        categoryPerformance
      });
    } catch (error) {
      console.error('Erro ao gerar relatórios:', error);
      toast.error('Erro ao carregar relatórios');
    } finally {
      setLoading(false);
    }
  };

  const exportReport = (type: string) => {
    toast.success(`Relatório de ${type} exportado com sucesso!`);
    // Here you would implement actual export functionality
  };

  const calculateGrowth = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  const currentMonthSales = reportData.salesByMonth[reportData.salesByMonth.length - 1]?.sales || 0;
  const previousMonthSales = reportData.salesByMonth[reportData.salesByMonth.length - 2]?.sales || 0;
  const salesGrowth = calculateGrowth(currentMonthSales, previousMonthSales);

  const currentMonthRevenue = reportData.salesByMonth[reportData.salesByMonth.length - 1]?.revenue || 0;
  const previousMonthRevenue = reportData.salesByMonth[reportData.salesByMonth.length - 2]?.revenue || 0;
  const revenueGrowth = calculateGrowth(currentMonthRevenue, previousMonthRevenue);

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
          <h1 className="text-3xl font-bold">Relatórios e Analytics</h1>
          <p className="text-muted-foreground">
            Acompanhe o desempenho da plataforma e tome decisões baseadas em dados
          </p>
        </div>
        
        <div className="flex gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
              <SelectItem value="365">Último ano</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" onClick={() => exportReport('geral')}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Vendas do Mês"
          value={currentMonthSales}
          icon={ShoppingCart}
          trend={salesGrowth > 0 ? 'up' : salesGrowth < 0 ? 'down' : 'neutral'}
          description={`${salesGrowth > 0 ? '+' : ''}${salesGrowth.toFixed(1)}% vs mês anterior`}
          loading={loading}
        />
        
        <MetricCard
          title="Receita do Mês"
          value={currentMonthRevenue}
          icon={DollarSign}
          format="currency"
          trend={revenueGrowth > 0 ? 'up' : revenueGrowth < 0 ? 'down' : 'neutral'}
          description={`${revenueGrowth > 0 ? '+' : ''}${revenueGrowth.toFixed(1)}% vs mês anterior`}
          loading={loading}
        />
        
        <MetricCard
          title="Total de Usuários"
          value={users?.length || 0}
          icon={Users}
          loading={loading}
        />
        
        <MetricCard
          title="Produtos Ativos"
          value={products?.filter((p: any) => p.is_active).length || 0}
          icon={Package}
          loading={loading}
        />
      </div>

      <Tabs defaultValue="sales" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="sales">Vendas</TabsTrigger>
          <TabsTrigger value="products">Produtos</TabsTrigger>
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="categories">Categorias</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Vendas por Mês
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reportData.salesByMonth.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="font-medium">{item.month}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground">
                          {item.sales} vendas
                        </span>
                        <span className="font-medium">
                          R$ {item.revenue.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Top Vendedores
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reportData.topSellers.map((seller, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">#{index + 1}</Badge>
                        <span className="font-medium">{seller.name}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground">
                          {seller.sales} vendas
                        </span>
                        <span className="font-medium">
                          R$ {seller.revenue.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="products" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Produtos Mais Vendidos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reportData.topProducts.map((product, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">#{index + 1}</Badge>
                      <span className="font-medium">{product.name}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-muted-foreground">
                        {product.sales} vendas
                      </span>
                      <span className="font-medium">
                        R$ {product.revenue.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Crescimento de Usuários
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reportData.userGrowth.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="font-medium">{item.month}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{item.users} usuários</span>
                      {index > 0 && (
                        <Badge variant={
                          item.users > reportData.userGrowth[index - 1].users 
                            ? 'default' 
                            : 'secondary'
                        }>
                          {item.users > reportData.userGrowth[index - 1].users 
                            ? '+' + (item.users - reportData.userGrowth[index - 1].users)
                            : item.users - reportData.userGrowth[index - 1].users
                          }
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Performance por Categoria
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reportData.categoryPerformance.map((category, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="font-medium">{category.category}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-muted-foreground">
                        {category.products} produtos
                      </span>
                      <span className="font-medium">
                        {category.sales} vendas
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminReports;
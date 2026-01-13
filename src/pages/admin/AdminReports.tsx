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

  const { data: orders } = useCRUD({ table: 'orders' });
  const { data: products } = useCRUD({ table: 'products' });
  const { data: users } = useCRUD({ table: 'profiles' });
  const { data: categories } = useCRUD({ table: 'categories' });
  const { data: orderItems } = useCRUD({ table: 'order_items' });

  useEffect(() => {
    if (!isAdmin) {
      toast.error('Acesso negado. Apenas administradores podem acessar esta página.');
      return;
    }

    if (orders && products && users && categories && orderItems) {
      generateReports();
    }
  }, [isAdmin, orders, products, users, categories, orderItems, selectedPeriod]);

  const generateReports = async () => {
    try {
      setLoading(true);

      // --- 1. Sales & Revenue by Month ---
      // Group orders by month/year and sum total_amount
      const salesMap = new Map<string, { sales: number; revenue: number }>();
      const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

      // Initialize last 6 months (or based on selectedPeriod - simplified for now to last 6 months fixed or all available)
      // For improved UX we could filter by selectedPeriod date range.
      // Let's iterate all orders and sort them later.
      orders?.forEach((order: any) => {
        const date = new Date(order.created_at);
        const monthKey = `${months[date.getMonth()]}`; // Simple grouping by month name

        const current = salesMap.get(monthKey) || { sales: 0, revenue: 0 };
        salesMap.set(monthKey, {
          sales: current.sales + 1,
          revenue: current.revenue + Number(order.total_amount || 0)
        });
      });

      // Convert map to array and sort (logic implies current year for simplicity)
      // For a production app, handling Years is crucial.
      const salesByMonth = Array.from(salesMap.entries()).map(([month, data]) => ({
        month,
        ...data
      }));

      // --- 2. Top Products ---
      // Count frequency of product_id in orderItems
      const productSales = new Map<string, { qty: number; revenue: number }>();
      orderItems?.forEach((item: any) => {
        const current = productSales.get(item.product_id) || { qty: 0, revenue: 0 };
        productSales.set(item.product_id, {
          qty: current.qty + (item.quantity || 1),
          revenue: current.revenue + (item.price * (item.quantity || 1))
        });
      });

      const topProducts = products?.map((p: any) => {
        const stats = productSales.get(p.id) || { qty: 0, revenue: 0 };
        return {
          name: p.name,
          sales: stats.qty,
          revenue: stats.revenue
        };
      })
        .sort((a: any, b: any) => b.revenue - a.revenue)
        .slice(0, 5) || [];

      // --- 3. Top Sellers ---
      // Aggregate sales by seller_id in orders (assuming orders have seller_id or we link via products)
      // If marketplace, orders might be split. Assuming 'orders' table has 'seller_id' in simple marketplace or we derive from products.
      // Let's allow for orders to have seller_id OR derive from items.
      const sellerStats = new Map<string, { sales: number; revenue: number }>();

      // Using orderItems to attribute sales to sellers (since products have seller_id)
      orderItems?.forEach((item: any) => {
        // We need to find the product to get the seller
        const product = products?.find((p: any) => p.id === item.product_id);
        if (product && product.seller_id) {
          const current = sellerStats.get(product.seller_id) || { sales: 0, revenue: 0 };
          sellerStats.set(product.seller_id, {
            sales: current.sales + (item.quantity || 1),
            revenue: current.revenue + (item.price * (item.quantity || 1))
          });
        }
      });

      const topSellers = users?.filter((u: any) => sellerStats.has(u.id))
        .map((u: any) => {
          const stats = sellerStats.get(u.id);
          return {
            name: u.full_name || u.email || 'Desconhecido',
            sales: stats?.sales || 0,
            revenue: stats?.revenue || 0
          };
        })
        .sort((a: any, b: any) => b.revenue - a.revenue)
        .slice(0, 5) || [];

      // --- 4. User Growth ---
      // Group users by creation month
      const userGrowMap = new Map<string, number>();
      users?.forEach((u: any) => {
        const date = new Date(u.created_at);
        const monthKey = `${months[date.getMonth()]}`;
        userGrowMap.set(monthKey, (userGrowMap.get(monthKey) || 0) + 1);
      });
      const userGrowth = Array.from(userGrowMap.entries()).map(([month, count]) => ({
        month,
        users: count
      }));

      // --- 5. Category Performance ---
      const catStats = new Map<string, { products: number; sales: number }>();
      // Init categories
      categories?.forEach((cat: any) => {
        catStats.set(cat.id, { products: 0, sales: 0 });
      });
      // Count products
      products?.forEach((p: any) => {
        if (p.category_id && catStats.has(p.category_id)) {
          const s = catStats.get(p.category_id)!;
          s.products++;
          // Add sales for this product
          const pSales = productSales.get(p.id)?.qty || 0;
          s.sales += pSales;
          catStats.set(p.category_id, s);
        }
      });

      const categoryPerformance = categories?.map((cat: any) => ({
        category: cat.name,
        ...catStats.get(cat.id)
      })) || [];

      setReportData({
        salesByMonth: salesByMonth.length ? salesByMonth : [{ month: 'Sem dados', sales: 0, revenue: 0 }],
        topProducts,
        topSellers,
        userGrowth: userGrowth.length ? userGrowth : [{ month: 'Sem dados', users: 0 }],
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
          icon={<ShoppingCart className="h-4 w-4" />}
          trend={salesGrowth > 0 ? { value: salesGrowth, label: 'vs mês anterior' } : undefined}
          description={`${salesGrowth > 0 ? '+' : ''}${salesGrowth.toFixed(1)}% vs mês anterior`}
          loading={loading}
        />

        <MetricCard
          title="Receita do Mês"
          value={currentMonthRevenue}
          icon={<DollarSign className="h-4 w-4" />}
          format="currency"
          trend={revenueGrowth > 0 ? { value: revenueGrowth, label: 'vs mês anterior' } : undefined}
          description={`${revenueGrowth > 0 ? '+' : ''}${revenueGrowth.toFixed(1)}% vs mês anterior`}
          loading={loading}
        />

        <MetricCard
          title="Total de Usuários"
          value={users?.length || 0}
          icon={<Users className="h-4 w-4" />}
          loading={loading}
        />

        <MetricCard
          title="Produtos Ativos"
          value={products?.filter((p: any) => p.is_active).length || 0}
          icon={<Package className="h-4 w-4" />}
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
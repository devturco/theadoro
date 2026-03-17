import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@theadoro/ui';
import { Button } from '@theadoro/ui';
import { Badge } from '@theadoro/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@theadoro/ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@theadoro/ui';
import { useAuth } from '@/contexts/AuthContext';
import { useRole } from '@/hooks/useRole';
import { useCRUD } from '@/hooks/useCRUD';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Package,
  ShoppingBag,
  Calendar,
  Download,
  Filter
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ReportData {
  salesByMonth: Array<{ month: string; sales: number; revenue: number }>;
  topProducts: Array<{ name: string; sales: number; revenue: number }>;
  revenueByCategory: Array<{ category: string; revenue: number; percentage: number }>;
  appointmentStats: Array<{ month: string; appointments: number; conversion: number }>;
}

export default function SellerReports() {
  const { user } = useAuth();
  const { hasRole } = useRole();
  const [reportData, setReportData] = useState<ReportData>({
    salesByMonth: [],
    topProducts: [],
    revenueByCategory: [],
    appointmentStats: []
  });
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('last_6_months');

  const isSeller = hasRole('seller');

  useEffect(() => {
    if (user && isSeller) {
      loadReportData();
    }
  }, [user, isSeller, selectedPeriod]);

  const loadReportData = async () => {
    try {
      setLoading(true);

      const { data: orderItems, error: salesError } = await supabase
        .from('order_items')
        .select(`
          unit_price,
          quantity,
          created_at,
          products (name, categories (name))
        `)
        .eq('seller_id', user?.id);

      if (salesError) throw salesError;

      const { data: appointments, error: apptError } = await supabase
        .from('appointments')
        .select('status, appointment_date')
        .eq('seller_id', user?.id);

      if (apptError) throw apptError;

      // 1. Sales by Month
      const salesByMonthMap = new Map();
      const productsMap = new Map();
      const categoriesMap = new Map();

      orderItems?.forEach(item => {
        const date = new Date(item.created_at);
        const monthKey = `${date.toLocaleString('pt-BR', { month: 'short' })} ${date.getFullYear()}`;
        const amount = Number(item.unit_price) * Number(item.quantity);

        if (!salesByMonthMap.has(monthKey)) {
          salesByMonthMap.set(monthKey, { month: monthKey, sales: 0, revenue: 0 });
        }
        const monthData = salesByMonthMap.get(monthKey);
        monthData.sales += item.quantity;
        monthData.revenue += amount;

        const prodName = (item.products as any)?.name || 'Desconhecido';
        if (!productsMap.has(prodName)) {
          productsMap.set(prodName, { name: prodName, sales: 0, revenue: 0 });
        }
        const prodData = productsMap.get(prodName);
        prodData.sales += item.quantity;
        prodData.revenue += amount;

        const catName = (item.products as any)?.categories?.name || 'Geral';
        if (!categoriesMap.has(catName)) {
          categoriesMap.set(catName, { category: catName, revenue: 0 });
        }
        categoriesMap.get(catName).revenue += amount;
      });

      // 2. Appointment Stats by Month
      const apptMonthMap = new Map();
      appointments?.forEach(appt => {
        const date = new Date(appt.appointment_date);
        const monthKey = `${date.toLocaleString('pt-BR', { month: 'short' })} ${date.getFullYear()}`;

        if (!apptMonthMap.has(monthKey)) {
          apptMonthMap.set(monthKey, { month: monthKey, appointments: 0, completed: 0 });
        }
        const monthData = apptMonthMap.get(monthKey);
        monthData.appointments += 1;
        if (appt.status === 'completed') monthData.completed += 1;
      });

      const totalRevenue = orderItems?.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0) || 0;

      setReportData({
        salesByMonth: Array.from(salesByMonthMap.values()).slice(-6),
        topProducts: Array.from(productsMap.values())
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 5),
        revenueByCategory: Array.from(categoriesMap.values())
          .map(cat => ({
            ...cat,
            percentage: totalRevenue > 0 ? Math.round((cat.revenue / totalRevenue) * 100) : 0
          }))
          .sort((a, b) => b.revenue - a.revenue),
        appointmentStats: Array.from(apptMonthMap.values()).map(item => ({
          month: item.month,
          appointments: item.appointments,
          conversion: item.appointments > 0 ? Math.round((item.completed / item.appointments) * 100) : 0
        })).slice(-6)
      });
    } catch (error) {
      console.error('Error loading report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = () => {
    // Mock export functionality
    console.log('Exporting report for period:', selectedPeriod);
    // In a real implementation, this would generate and download a PDF or Excel file
  };

  const totalRevenue = reportData.salesByMonth.reduce((sum, item) => sum + item.revenue, 0);
  const totalSales = reportData.salesByMonth.reduce((sum, item) => sum + item.sales, 0);
  const averageOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;
  const totalAppointments = reportData.appointmentStats.reduce((sum, item) => sum + item.appointments, 0);

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
          <h1 className="text-3xl font-bold">Relatórios de Vendas</h1>
          <p className="text-muted-foreground">
            Análise detalhada do seu desempenho
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Selecione o período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last_30_days">Últimos 30 dias</SelectItem>
              <SelectItem value="last_3_months">Últimos 3 meses</SelectItem>
              <SelectItem value="last_6_months">Últimos 6 meses</SelectItem>
              <SelectItem value="last_year">Último ano</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleExportReport}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {totalRevenue.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Vendas</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSales}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {averageOrderValue.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agendamentos</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAppointments}</div>
          </CardContent>
        </Card>
      </div>

      {/* Reports Tabs */}
      <Tabs defaultValue="sales" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sales">Vendas</TabsTrigger>
          <TabsTrigger value="products">Produtos</TabsTrigger>
          <TabsTrigger value="categories">Categorias</TabsTrigger>
          <TabsTrigger value="appointments">Agendamentos</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-6">
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

        <TabsContent value="categories" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Receita por Categoria
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reportData.revenueByCategory.map((category, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{category.category}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {category.percentage}%
                        </span>
                        <span className="font-medium">
                          R$ {category.revenue.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-wine h-2 rounded-full"
                        style={{ width: `${category.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appointments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Agendamentos e Conversão
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reportData.appointmentStats.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="font-medium">{item.month}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-muted-foreground">
                        {item.appointments} agendamentos
                      </span>
                      <Badge variant="outline">
                        {item.conversion}% conversão
                      </Badge>
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
}
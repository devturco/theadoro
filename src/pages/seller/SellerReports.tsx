import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
      
      // Mock data - replace with actual API calls
      const mockReportData: ReportData = {
        salesByMonth: [
          { month: 'Jan 2024', sales: 15, revenue: 4500.00 },
          { month: 'Fev 2024', sales: 22, revenue: 6600.00 },
          { month: 'Mar 2024', sales: 18, revenue: 5400.00 },
          { month: 'Abr 2024', sales: 25, revenue: 7500.00 },
          { month: 'Mai 2024', sales: 30, revenue: 9000.00 },
          { month: 'Jun 2024', sales: 28, revenue: 8400.00 }
        ],
        topProducts: [
          { name: 'Colar Personalizado', sales: 45, revenue: 13500.00 },
          { name: 'Pulseira Artesanal', sales: 38, revenue: 11400.00 },
          { name: 'Kit Presente Especial', sales: 25, revenue: 11250.00 },
          { name: 'Anel Customizado', sales: 22, revenue: 8800.00 },
          { name: 'Brincos Exclusivos', sales: 18, revenue: 5400.00 }
        ],
        revenueByCategory: [
          { category: 'Joias', revenue: 25000.00, percentage: 45 },
          { category: 'Acessórios', revenue: 18000.00, percentage: 32 },
          { category: 'Presentes', revenue: 12800.00, percentage: 23 }
        ],
        appointmentStats: [
          { month: 'Jan 2024', appointments: 12, conversion: 75 },
          { month: 'Fev 2024', appointments: 18, conversion: 83 },
          { month: 'Mar 2024', appointments: 15, conversion: 80 },
          { month: 'Abr 2024', appointments: 20, conversion: 85 },
          { month: 'Mai 2024', appointments: 25, conversion: 88 },
          { month: 'Jun 2024', appointments: 22, conversion: 86 }
        ]
      };

      setReportData(mockReportData);
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
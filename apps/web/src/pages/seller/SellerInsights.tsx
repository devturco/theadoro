import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    LineChart, Line, AreaChart, Area
} from 'recharts';
import {
    TrendingUp,
    Users,
    Eye,
    Target,
    Sparkles,
    ArrowUpRight,
    ArrowDownRight,
    Info,
    Lightbulb,
    ShoppingBag,
    Clock,
    Star,
    Plus
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@theadoro/ui';
import { Skeleton } from '@theadoro/ui';
import { Badge } from '@theadoro/ui';
import { Button } from '@theadoro/ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@theadoro/ui';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@theadoro/ui';
import { Input } from '@theadoro/ui';
import { ScrollArea } from '@theadoro/ui';
import { cn } from '@/lib/utils';

export const SellerInsights: React.FC = () => {
    const [timeRange, setTimeRange] = React.useState('30'); // '7', '30', '90', 'all'

    // 1. Fetch Analytics Data
    const { data: stats, isLoading: loadingStats } = useQuery({
        queryKey: ['seller-product-stats-daily', timeRange],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            // Check if admin
            const { data: roleData } = await supabase
                .from('user_roles')
                .select('role')
                .eq('user_id', user.id)
                .eq('role', 'admin')
                .maybeSingle();

            const isAdmin = !!roleData;

            let query = (supabase.from as any)('product_stats_daily')
                .select('*');

            if (timeRange !== 'all') {
                const days = parseInt(timeRange);
                const startDate = new Date();
                startDate.setDate(startDate.getDate() - days);
                const startDateISO = startDate.toISOString().split('T')[0];
                query = query.gte('date', startDateISO);
            }

            if (!isAdmin) {
                query = query.eq('seller_id', user.id);
            }

            const { data, error } = await query
                .order('date', { ascending: true });

            if (error) throw error;
            return data;
        }
    });

    // 2. Fetch Top Products
    const { data: topProducts, isLoading: loadingTop } = useQuery({
        queryKey: ['seller-top-products', timeRange],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            // Check if admin
            const { data: roleData } = await supabase
                .from('user_roles')
                .select('role')
                .eq('user_id', user.id)
                .eq('role', 'admin')
                .maybeSingle();

            const isAdmin = !!roleData;

            let query = (supabase.from as any)('product_stats_daily')
                .select('product_id, products(name), total_views, total_conversions');

            if (timeRange !== 'all') {
                const days = parseInt(timeRange);
                const startDate = new Date();
                startDate.setDate(startDate.getDate() - days);
                const startDateISO = startDate.toISOString().split('T')[0];
                query = query.gte('date', startDateISO);
            }

            if (!isAdmin) {
                query = query.eq('seller_id', user.id);
            }

            const { data, error } = await query;

            if (error) throw error;

            // Aggregate by product (summing views across days)
            const aggregated = (data || []).reduce((acc: any, curr: any) => {
                const id = curr.product_id;
                if (!acc[id]) {
                    acc[id] = {
                        name: curr.products?.name || 'Produto sem nome',
                        views: 0,
                        conversions: 0
                    };
                }
                acc[id].views += Number(curr.total_views || 0);
                acc[id].conversions += Number(curr.total_conversions || 0);
                return acc;
            }, {});

            return Object.values(aggregated).sort((a: any, b: any) => b.views - a.views);
        }
    });

    // 3. Totals and REAL Trends
    const metrics = useMemo(() => {
        const sumViews = (arr: any[]) => arr.reduce((sum, s) => sum + Number(s.total_views || 0), 0);
        const sumConvs = (arr: any[]) => arr.reduce((sum, s) => sum + Number(s.total_conversions || 0), 0);

        if (!stats || stats.length === 0) {
            return {
                views: 0,
                viewsTrend: 0,
                conversions: 0,
                convTrend: 0,
                rate: 0,
                rateTrend: 0,
                isAllTime: timeRange === 'all'
            };
        }

        if (timeRange === 'all') {
            const totalViews = sumViews(stats);
            const totalConvs = sumConvs(stats);
            return {
                views: totalViews,
                viewsTrend: 0,
                conversions: totalConvs,
                convTrend: 0,
                rate: totalViews > 0 ? (totalConvs / totalViews) * 100 : 0,
                rateTrend: 0,
                isAllTime: true
            };
        }

        const days = parseInt(timeRange);
        const now = new Date();
        const periodAgo = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
        const doublePeriodAgo = new Date(now.getTime() - 2 * days * 24 * 60 * 60 * 1000);

        const currentPeriod = stats.filter(s => new Date(s.date) >= periodAgo);
        const previousPeriod = stats.filter(s => new Date(s.date) >= doublePeriodAgo && new Date(s.date) < periodAgo);

        const currViews = sumViews(currentPeriod);
        const prevViews = sumViews(previousPeriod);
        const currConvs = sumConvs(currentPeriod);
        const prevConvs = sumConvs(previousPeriod);

        const calcTrend = (curr: number, prev: number) => {
            if (prev === 0) return curr > 0 ? 100 : 0;
            return ((curr - prev) / prev) * 100;
        };

        const currRate = currViews > 0 ? (currConvs / currViews) * 100 : 0;
        const prevRate = prevViews > 0 ? (prevConvs / prevViews) * 100 : 0;

        return {
            views: currViews,
            viewsTrend: calcTrend(currViews, prevViews),
            conversions: currConvs,
            convTrend: calcTrend(currConvs, prevConvs),
            rate: currRate,
            rateTrend: currRate - prevRate,
            isAllTime: false
        };
    }, [stats, timeRange]);

    // 4. Chart Data Preparation (with Date Padding)
    const chartData = useMemo(() => {
        if (!stats) return [];

        let daysToPad = 30; // Default
        if (timeRange !== 'all') {
            daysToPad = parseInt(timeRange);
        } else if (stats.length > 0) {
            // For 'all-time', show everything since the first event, at least 7 days
            const earliestDate = new Date(stats[0].date);
            const today = new Date();
            daysToPad = Math.ceil((today.getTime() - earliestDate.getTime()) / (1000 * 60 * 60 * 24));
            daysToPad = Math.max(daysToPad, 7);
            daysToPad = Math.min(daysToPad, 365); // Cap at 1 year for visual clarity
        }

        const dataMap = new Map((stats || []).map(s => [s.date, s]));
        const result = [];
        const now = new Date();

        for (let i = daysToPad; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];

            if (dataMap.has(dateStr)) {
                result.push(dataMap.get(dateStr));
            } else {
                result.push({
                    date: dateStr,
                    total_views: 0,
                    total_conversions: 0
                });
            }
        }
        return result;
    }, [stats, timeRange]);

    // 5. AI Advice Engine
    const aiTips = useMemo(() => {
        const tips = [];
        if (!topProducts || (topProducts as any[]).length === 0) return [];

        const products = topProducts as any[];

        // Tip 1: Low conversion on high traffic
        const highTrafficLowConv = products.find((p: any) => p.views > 20 && (p.conversions / p.views) < 0.02);
        if (highTrafficLowConv) {
            tips.push({
                title: 'Otimização de Conversão',
                text: `O produto "${highTrafficLowConv.name}" tem muitas visitas, mas poucos cliques em comprar. Considere revisar o preço ou adicionar frete grátis.`,
                icon: Lightbulb,
                color: 'amber'
            });
        }

        // Tip 2: Dropping traffic
        if (metrics.viewsTrend < -10) {
            tips.push({
                title: 'Tráfego em Queda',
                text: 'Suas visitas caíram esta semana. Experimente atualizar a descrição dos seus produtos com novas palavras-chave.',
                icon: TrendingUp,
                color: 'blue'
            });
        }

        // Tip 3: Star product
        const starProduct = products[0];
        if (starProduct && starProduct.views > 50) {
            tips.push({
                title: 'Produto Estrela',
                text: `"${starProduct.name}" é o seu campeão de acessos. Que tal criar um kit ou variação similar para aproveitar o embalo?`,
                icon: Sparkles,
                color: 'indigo'
            });
        }

        // Default if empty
        if (tips.length === 0) {
            tips.push({
                title: 'Continue assim!',
                text: 'Seu desempenho está estável. Mantenha seus produtos atualizados para atrair mais clientes.',
                icon: Info,
                color: 'green'
            });
        }

        return tips;
    }, [topProducts, metrics]);

    const [chatOpen, setChatOpen] = React.useState(false);
    const [chatInput, setChatInput] = React.useState('');
    const [chatHistory, setChatHistory] = React.useState<{ role: 'user' | 'ai', content: string }[]>([]);

    const handleChat = () => {
        if (!chatInput.trim()) return;

        const userMsg = chatInput;
        setChatHistory(prev => [...prev, { role: 'user', content: userMsg }]);
        setChatInput('');

        // Simple heuristic response
        setTimeout(() => {
            let response = "Interessante sua pergunta! Analisando seus dados, percebo que você tem um bom potencial de crescimento.";
            const products = topProducts as any[];
            if (userMsg.toLowerCase().includes('vendas') || userMsg.toLowerCase().includes('melhorar')) {
                response = `Para melhorar suas vendas, foque no produto "${products?.[0]?.name || 'mais visto'}". Ele já tem tráfego, agora só precisa de um incentivo extra para conversão!`;
            } else if (userMsg.toLowerCase().includes('visitas')) {
                response = "Para aumentar visitas, recomendo compartilhar seus links nas redes sociais nos horários de pico (final da tarde).";
            }
            setChatHistory(prev => [...prev, { role: 'ai', content: response }]);
        }, 600);
    };

    if (loadingStats || loadingTop) {
        return (
            <div className="space-y-6 p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full" />)}
                </div>
                <Skeleton className="h-[400px] w-full" />
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Insights do Vendedor</h1>
                    <p className="text-gray-500">Métricas de desempenho e sugestões da IA para crescer seu negócio.</p>
                </div>
                <div className="flex bg-white rounded-lg border p-1 shadow-sm h-fit">
                    {[
                        { label: '7d', value: '7' },
                        { label: '30d', value: '30' },
                        { label: '90d', value: '90' },
                        { label: 'Tudo', value: 'all' }
                    ].map((period) => (
                        <button
                            key={period.value}
                            onClick={() => setTimeRange(period.value)}
                            className={cn(
                                "px-3 py-1 text-sm font-medium rounded-md transition-all",
                                timeRange === period.value
                                    ? "bg-indigo-600 text-white shadow-sm"
                                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                            )}
                        >
                            {period.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="hover:shadow-md transition-shadow border-l-4 border-l-blue-500">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Visualizações Totais</CardTitle>
                        <Eye className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metrics.views}</div>
                        {!metrics.isAllTime && (
                            <p className={cn(
                                "text-xs flex items-center mt-1",
                                metrics.viewsTrend >= 0 ? "text-green-600" : "text-red-600"
                            )}>
                                {metrics.viewsTrend >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                                {Math.abs(metrics.viewsTrend).toFixed(1)}% vs. período anterior
                            </p>
                        )}
                        {metrics.isAllTime && (
                            <p className="text-xs text-gray-500 mt-1">Total histórico acumulado</p>
                        )}
                    </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow border-l-4 border-l-green-500">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Conversões (Cliques/Reservas)</CardTitle>
                        <ShoppingBag className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metrics.conversions}</div>
                        {!metrics.isAllTime && (
                            <p className={cn(
                                "text-xs flex items-center mt-1",
                                metrics.convTrend >= 0 ? "text-green-600" : "text-red-600"
                            )}>
                                {metrics.convTrend >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                                {Math.abs(metrics.convTrend).toFixed(1)}% vs. período anterior
                            </p>
                        )}
                        {metrics.isAllTime && (
                            <p className="text-xs text-gray-500 mt-1">Total histórico acumulado</p>
                        )}
                    </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow border-l-4 border-l-purple-500">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Taxa de Conversão</CardTitle>
                        <Target className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metrics.rate.toFixed(2)}%</div>
                        {!metrics.isAllTime && (
                            <p className={cn(
                                "text-xs flex items-center mt-1",
                                metrics.rateTrend >= 0 ? "text-green-600" : "text-amber-600"
                            )}>
                                {metrics.rateTrend >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                                {Math.abs(metrics.rateTrend).toFixed(1)}pp vs. período anterior
                            </p>
                        )}
                        {metrics.isAllTime && (
                            <p className="text-xs text-gray-500 mt-1">Total histórico acumulado</p>
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Chart */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-gray-400" />
                            Desempenho Diário
                        </CardTitle>
                        <CardDescription>
                            {timeRange === 'all'
                                ? 'Todo o histórico de visualizações'
                                : `Visualizações e cliques nos últimos ${timeRange} dias`}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[350px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorConvs" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis
                                        dataKey="date"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 12, fill: '#64748b' }}
                                        tickFormatter={(str) => {
                                            // Handle YYYY-MM-DD to avoid timezone shift
                                            const [year, month, day] = str.split('-').map(Number);
                                            const d = new Date(year, month - 1, day);
                                            return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
                                        }}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 12, fill: '#64748b' }}
                                    />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="total_views"
                                        name="Visualizações"
                                        stroke="#6366f1"
                                        strokeWidth={3}
                                        dot={chartData.length < 40 ? { r: 4, strokeWidth: 2, fill: '#fff' } : false}
                                        activeDot={{ r: 6, strokeWidth: 0, fill: '#6366f1' }}
                                        fillOpacity={1}
                                        fill="url(#colorViews)"
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="total_conversions"
                                        name="Conversões"
                                        stroke="#10b981"
                                        strokeWidth={3}
                                        strokeDasharray="5 5"
                                        dot={chartData.length < 40 ? { r: 3, strokeWidth: 2, fill: '#fff' } : false}
                                        activeDot={{ r: 5, strokeWidth: 0, fill: '#10b981' }}
                                        fillOpacity={1}
                                        fill="url(#colorConvs)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Top Products */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Star className="h-5 w-5 text-yellow-500" />
                            Produtos em Destaque
                        </CardTitle>
                        <CardDescription>Maior volume de tráfego</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {topProducts?.map((product: any, idx: number) => (
                                <div key={idx} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                                    <div className="flex flex-col">
                                        <span className="font-semibold text-sm text-gray-900 truncate max-w-[150px]">{product.name}</span>
                                        <span className="text-xs text-gray-500">{product.views} visualizações</span>
                                    </div>
                                    <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100">
                                        {((product.conversions / product.views) * 100).toFixed(1)}% conv.
                                    </Badge>
                                </div>
                            ))}
                            {(!topProducts || topProducts.length === 0) && (
                                <div className="text-center py-8 text-gray-400 text-sm italic">
                                    Aguardando dados de tráfego...
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* AI Assistant Section */}
            <Card className="bg-gradient-to-br from-indigo-50 via-white to-blue-50 border-indigo-100 shadow-sm overflow-hidden relative">
                <div className="absolute top-[-20px] right-[-20px] w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-indigo-900">
                        <div className="p-2 bg-indigo-600 rounded-lg">
                            <Sparkles className="h-5 w-5 text-white" />
                        </div>
                        Dicas da IA para seu Negócio
                    </CardTitle>
                    <CardDescription className="text-indigo-700/70 font-medium">Análise inteligente baseada no seu desempenho recente</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {aiTips.map((tip: any, idx: number) => (
                            <div key={idx} className="p-4 rounded-xl bg-white border border-indigo-100 shadow-sm hover:shadow-md transition-all cursor-default group">
                                <div className="flex items-start gap-4">
                                    <div className={cn(
                                        "p-2 rounded-lg group-hover:scale-110 transition-transform",
                                        tip.color === 'amber' ? 'bg-amber-50' : tip.color === 'blue' ? 'bg-blue-50' : 'bg-green-50'
                                    )}>
                                        <tip.icon className={cn(
                                            "h-5 w-5",
                                            tip.color === 'amber' ? 'text-amber-600' : tip.color === 'blue' ? 'text-blue-600' : 'text-green-600'
                                        )} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-900 mb-1">{tip.title}</h4>
                                        <p className="text-sm text-gray-600 leading-relaxed">{tip.text}</p>
                                    </div>
                                </div>
                            </div>
                        ))}

                        <Dialog open={chatOpen} onOpenChange={setChatOpen}>
                            <DialogTrigger asChild>
                                <Card className="border-dashed border-2 border-indigo-200 bg-indigo-50/30 flex items-center justify-center p-6 text-center group cursor-pointer hover:bg-indigo-50 transition-colors">
                                    <div className="flex flex-col items-center">
                                        <div className="p-3 bg-white rounded-full shadow-sm mb-3 group-hover:rotate-12 transition-transform">
                                            <Plus className="h-6 w-6 text-indigo-600" />
                                        </div>
                                        <h4 className="font-bold text-indigo-900">Perguntar à IA</h4>
                                        <p className="text-xs text-indigo-700/60 font-medium">Gere uma análise personalizada de qualquer produto</p>
                                    </div>
                                </Card>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[500px] h-[600px] flex flex-col p-0">
                                <DialogHeader className="p-6 border-b pb-4">
                                    <DialogTitle className="flex items-center gap-2">
                                        <Sparkles className="h-5 w-5 text-indigo-600" />
                                        Assistente de Negócios IA
                                    </DialogTitle>
                                    <DialogDescription>Tire dúvidas sobre seu desempenho e receba sugestões de melhoria.</DialogDescription>
                                </DialogHeader>

                                <ScrollArea className="flex-1 p-6">
                                    <div className="space-y-4">
                                        <div className="bg-indigo-50 p-3 rounded-lg text-sm text-indigo-900 max-w-[80%]">
                                            Olá! Sou seu assistente Theadoro. Como posso ajudar você a vender mais hoje?
                                        </div>
                                        {chatHistory.map((msg, i) => (
                                            <div key={i} className={cn(
                                                "p-3 rounded-lg text-sm max-w-[80%]",
                                                msg.role === 'user' ? "bg-gray-100 ml-auto text-gray-900" : "bg-indigo-50 text-indigo-900"
                                            )}>
                                                {msg.content}
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>

                                <div className="p-4 border-t mt-auto">
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="Pergunte algo... (ex: como aumentar minhas visitas?)"
                                            value={chatInput}
                                            onChange={(e) => setChatInput(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleChat()}
                                        />
                                        <Button onClick={handleChat} className="bg-indigo-600 hover:bg-indigo-700">Enviar</Button>
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default SellerInsights;

import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    AreaChart, Area
} from 'recharts';
import {
    TrendingUp,
    Users,
    Eye,
    Target,
    Sparkles,
    ArrowDownRight,
    Info,
    Lightbulb,
    ShoppingBag,
    Star,
    Plus,
    Building2,
    Search
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

const AdminInsights: React.FC = () => {
    const [timeRange, setTimeRange] = React.useState('30'); // '7', '30', '90', 'all'

    // 1. Fetch Global Analytics Data (Platform-wide)
    const { data: stats, isLoading: loadingStats } = useQuery({
        queryKey: ['admin-global-stats-daily', timeRange],
        queryFn: async () => {
            let query = (supabase.from as any)('product_stats_daily').select('*');

            if (timeRange !== 'all') {
                const days = parseInt(timeRange);
                const startDate = new Date();
                startDate.setDate(startDate.getDate() - days);
                const startDateISO = startDate.toISOString().split('T')[0];
                query = query.gte('date', startDateISO);
            }

            const { data, error } = await query.order('date', { ascending: true });
            if (error) throw error;

            const aggregatedByDate = (data || []).reduce((acc: any, curr: any) => {
                const date = curr.date;
                if (!acc[date]) {
                    acc[date] = { date, total_views: 0, total_conversions: 0 };
                }
                acc[date].total_views += Number(curr.total_views || 0);
                acc[date].total_conversions += Number(curr.total_conversions || 0);
                return acc;
            }, {});

            return Object.values(aggregatedByDate).sort((a: any, b: any) => (a as any).date.localeCompare((b as any).date));
        }
    });

    // 2. Fetch Global Top Products (Traffic)
    const { data: topTrafficProducts, isLoading: loadingTopTraffic } = useQuery({
        queryKey: ['admin-top-traffic-products', timeRange],
        queryFn: async () => {
            let query = (supabase.from as any)('product_stats_daily')
                .select('product_id, products(name, profiles(full_name)), total_views');

            if (timeRange !== 'all') {
                const days = parseInt(timeRange);
                const start = new Date();
                start.setDate(start.getDate() - days);
                query = query.gte('date', start.toISOString().split('T')[0]);
            }

            const { data, error } = await query;
            if (error) throw error;

            const aggregated = (data || []).reduce((acc: any, curr: any) => {
                const id = curr.product_id;
                if (!acc[id]) {
                    acc[id] = {
                        name: curr.products?.name || 'Produto sem nome',
                        seller: (curr.products as any)?.profiles?.full_name || 'Vendedor Desconhecido',
                        views: 0
                    };
                }
                acc[id].views += Number(curr.total_views || 0);
                return acc;
            }, {});

            return Object.values(aggregated).sort((a: any, b: any) => b.views - a.views);
        }
    });

    // 3. Fetch Global Top Products (Sales)
    const { data: topSalesProducts, isLoading: loadingTopSales } = useQuery({
        queryKey: ['admin-top-sales-products', timeRange],
        queryFn: async () => {
            let query = supabase.from('order_items').select('product_id, quantity, products(name, profiles(full_name)), orders!inner(created_at, status)');

            if (timeRange !== 'all') {
                const days = parseInt(timeRange);
                const start = new Date();
                start.setDate(start.getDate() - days);
                query = query.gte('orders.created_at', start.toISOString());
            }

            query = query.neq('orders.status', 'cancelled');

            const { data, error } = await query;
            if (error) throw error;

            const aggregated = (data || []).reduce((acc: any, curr: any) => {
                const id = curr.product_id;
                if (!acc[id]) {
                    acc[id] = {
                        name: curr.products?.name || 'Produto sem nome',
                        seller: (curr.products as any)?.profiles?.full_name || 'Vendedor Desconhecido',
                        sales: 0
                    };
                }
                acc[id].sales += Number(curr.quantity || 0);
                return acc;
            }, {});

            return Object.values(aggregated).sort((a: any, b: any) => b.sales - a.sales);
        }
    });

    // 4. Totals and REAL Trends
    const metrics = useMemo(() => {
        const sumViews = (arr: any[]) => arr.reduce((sum, s) => sum + Number(s.total_views || 0), 0);
        const sumConvs = (arr: any[]) => arr.reduce((sum, s) => sum + Number(s.total_conversions || 0), 0);

        if (!stats || stats.length === 0) {
            return { views: 0, viewsTrend: 0, conversions: 0, convTrend: 0, rate: 0, rateTrend: 0, isAllTime: timeRange === 'all' };
        }

        if (timeRange === 'all') {
            const tv = sumViews(stats);
            const tc = sumConvs(stats);
            return { views: tv, viewsTrend: 0, conversions: tc, convTrend: 0, rate: tv > 0 ? (tc / tv) * 100 : 0, rateTrend: 0, isAllTime: true };
        }

        const days = parseInt(timeRange);
        const now = new Date();
        const periodAgo = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
        const doublePeriodAgo = new Date(now.getTime() - 2 * days * 24 * 60 * 60 * 1000);

        const currentPeriod = stats.filter(s => new Date((s as any).date) >= periodAgo);
        const previousPeriod = stats.filter(s => new Date((s as any).date) >= doublePeriodAgo && new Date((s as any).date) < periodAgo);

        const currV = sumViews(currentPeriod);
        const prevV = sumViews(previousPeriod);
        const currC = sumConvs(currentPeriod);
        const prevC = sumConvs(previousPeriod);

        const calcTrend = (curr: number, prev: number) => (prev === 0 ? (curr > 0 ? 100 : 0) : ((curr - prev) / prev) * 100);
        const currR = currV > 0 ? (currC / currV) * 100 : 0;
        const prevR = prevV > 0 ? (prevC / prevV) * 100 : 0;

        return { views: currV, viewsTrend: calcTrend(currV, prevV), conversions: currC, convTrend: calcTrend(currC, prevC), rate: currR, rateTrend: currR - prevR, isAllTime: false };
    }, [stats, timeRange]);

    const trafficProds = (topTrafficProducts as any[]) || [];
    const salesProds = (topSalesProducts as any[]) || [];

    // 5. Chart Data Preparation
    const chartData = useMemo(() => {
        if (!stats) return [];
        let daysToPad = 30;
        if (timeRange !== 'all') {
            daysToPad = parseInt(timeRange);
        } else if (stats.length > 0) {
            const earliest = new Date((stats[0] as any).date);
            daysToPad = Math.ceil((new Date().getTime() - earliest.getTime()) / (1000 * 60 * 60 * 24));
            daysToPad = Math.min(Math.max(daysToPad, 7), 365);
        }

        const dataMap = new Map((stats || []).map(s => [(s as any).date, s]));
        const result = [];
        const now = new Date();

        for (let i = daysToPad; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            const ds = d.toISOString().split('T')[0];
            result.push(dataMap.get(ds) || { date: ds, total_views: 0, total_conversions: 0 });
        }
        return result;
    }, [stats, timeRange]);

    // 6. Admin AI Advice Engine
    const aiTips = useMemo(() => {
        const tips = [];
        if (metrics.viewsTrend > 20) {
            tips.push({
                title: 'Tração em Expansão',
                text: 'A plataforma está recebendo um volume recorde de visitas. Hora de incentivar os vendedores a criarem cupons de desconto para fechar vendas!',
                icon: TrendingUp,
                color: 'blue'
            });
        }

        const ghostProduct = trafficProds.find((tp: any) => {
            const sp = salesProds.find(s => s.name === tp.name);
            return tp.views > 40 && (!sp || sp.sales < 2);
        });

        if (ghostProduct) {
            tips.push({
                title: 'Ajuste de Preço Sugerido',
                text: `O produto "${ghostProduct.name}" é um ímã de tráfego, mas as vendas não acompanham. Pode ser o frete ou o valor final.`,
                icon: Target,
                color: 'amber'
            });
        }

        const emergingSeller = trafficProds.find(p => p.views > 20 && p.views < 50);
        if (emergingSeller) {
            tips.push({
                title: 'Estrela em Ascensão',
                text: `O vendedor ${emergingSeller.seller} está ganhando tração orgânica. Um pequeno destaque pode fazê-lo decolar.`,
                icon: Sparkles,
                color: 'indigo'
            });
        }

        if (tips.length === 0) {
            tips.push({
                title: 'Monitoramento Estável',
                text: 'Os KPis da plataforma estão dentro da normalidade. Continue o bom trabalho de curadoria!',
                icon: Info,
                color: 'green'
            });
        }
        return tips;
    }, [trafficProds, salesProds, metrics]);

    const [chatOpen, setChatOpen] = React.useState(false);
    const [chatInput, setChatInput] = React.useState('');
    const [chatHistory, setChatHistory] = React.useState<{ role: 'user' | 'ai', content: string }[]>([]);

    const handleChat = () => {
        if (!chatInput.trim()) return;
        const msg = chatInput;
        setChatHistory(prev => [...prev, { role: 'user', content: msg }]);
        setChatInput('');
        setTimeout(() => {
            let res = "Analisando o comportamento global da Theadoro, vejo que o tráfego está bem distribuído. O que mais você gostaria de saber?";
            if (msg.toLowerCase().includes('vender') || msg.toLowerCase().includes('crescer')) {
                res = "Para acelerar o crescimento, recomendo identificar os 5 vendedores com mais visitas e oferecer uma consultoria de fotos/descrição para aumentar a conversão.";
            } else if (msg.toLowerCase().includes('categoria')) {
                res = "Atualmente as categorias de presentes personalizados estão com o maior engajamento orgânico.";
            }
            setChatHistory(prev => [...prev, { role: 'ai', content: res }]);
        }, 600);
    };

    if (loadingStats || loadingTopTraffic || loadingTopSales) {
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
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-600 rounded-lg shadow-indigo-200 shadow-lg">
                        <Building2 className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Insights Master</h1>
                        <p className="text-gray-500 font-medium">Visão estratégica global da plataforma THEADORO.</p>
                    </div>
                </div>
                <div className="flex bg-white rounded-xl border p-1 shadow-sm h-fit">
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
                                "px-4 py-1.5 text-sm font-semibold rounded-lg transition-all",
                                timeRange === period.value
                                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-100"
                                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                            )}
                        >
                            {period.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="hover:shadow-xl transition-all duration-300 border-none bg-indigo-50/50">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-indigo-600/70">Tráfego Total</CardTitle>
                        <div className="p-2 bg-white rounded-lg shadow-sm">
                            <Eye className="h-4 w-4 text-indigo-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-indigo-900">{metrics.views.toLocaleString()}</div>
                        {!metrics.isAllTime ? (
                            <p className={cn("text-xs font-bold flex items-center mt-2", metrics.viewsTrend >= 0 ? "text-green-600" : "text-red-500")}>
                                {metrics.viewsTrend >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                                {Math.abs(metrics.viewsTrend).toFixed(1)}% vs. período anterior
                            </p>
                        ) : (
                            <p className="text-xs text-indigo-600/50 font-bold mt-2">Volume histórico total</p>
                        )}
                    </CardContent>
                </Card>

                <Card className="hover:shadow-xl transition-all duration-300 border-none bg-emerald-50/50">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-emerald-600/70">Intenções de Compra</CardTitle>
                        <div className="p-2 bg-white rounded-lg shadow-sm">
                            <ShoppingBag className="h-4 w-4 text-emerald-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-emerald-900">{metrics.conversions.toLocaleString()}</div>
                        {!metrics.isAllTime ? (
                            <p className={cn("text-xs font-bold flex items-center mt-2", metrics.convTrend >= 0 ? "text-green-600" : "text-red-500")}>
                                {metrics.convTrend >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                                {Math.abs(metrics.convTrend).toFixed(1)}% vs. período anterior
                            </p>
                        ) : (
                            <p className="text-xs text-emerald-600/50 font-bold mt-2">Volume histórico total</p>
                        )}
                    </CardContent>
                </Card>

                <Card className="hover:shadow-xl transition-all duration-300 border-none bg-purple-50/50">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-purple-600/70">Eficiência de Vendas</CardTitle>
                        <div className="p-2 bg-white rounded-lg shadow-sm">
                            <Target className="h-4 w-4 text-purple-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-purple-900">{metrics.rate.toFixed(2)}%</div>
                        {!metrics.isAllTime ? (
                            <p className={cn("text-xs font-bold flex items-center mt-2", metrics.rateTrend >= 0 ? "text-green-600" : "text-amber-500")}>
                                {metrics.rateTrend >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                                {Math.abs(metrics.rateTrend).toFixed(1)}pp vs. período anterior
                            </p>
                        ) : (
                            <p className="text-xs text-purple-600/50 font-bold mt-2">Eficiência histórica</p>
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 border-gray-100 shadow-sm overflow-hidden text-black bg-white">
                    <CardHeader className="bg-gray-50/50 border-b border-gray-100">
                        <CardTitle className="flex items-center gap-2 text-gray-800">
                            <TrendingUp className="h-5 w-5 text-indigo-500" />
                            Curva de Crescimento Global
                        </CardTitle>
                        <CardDescription>Tráfego agregado da plataforma.</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="h-[350px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="adminColorViews" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis
                                        dataKey="date"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 12, fill: '#64748b', fontWeight: 'bold' }}
                                        tickFormatter={(str) => {
                                            const [year, month, day] = str.split('-').map(Number);
                                            return new Date(year, month - 1, day).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
                                        }}
                                    />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="total_views"
                                        name="Visualizações"
                                        stroke="#6366f1"
                                        strokeWidth={4}
                                        dot={chartData.length < 40 ? { r: 5, strokeWidth: 3, fill: '#fff' } : false}
                                        activeDot={{ r: 8, strokeWidth: 0, fill: '#6366f1' }}
                                        fillOpacity={1}
                                        fill="url(#adminColorViews)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-gray-100 shadow-sm overflow-hidden flex flex-col bg-white">
                    <CardHeader className="bg-gray-50/50 border-b border-gray-100">
                        <CardTitle className="flex items-center gap-2 text-gray-800">
                            <Star className="h-5 w-5 text-amber-500" />
                            Ranking de Produtos
                        </CardTitle>
                        <CardDescription>Tráfego vs Volume de Pedidos.</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6 flex-1 text-black">
                        <Tabs defaultValue="traffic" className="w-full">
                            <TabsList className="grid w-full grid-cols-2 mb-4">
                                <TabsTrigger value="traffic">Por Vistas</TabsTrigger>
                                <TabsTrigger value="sales">Por Vendas</TabsTrigger>
                            </TabsList>
                            <TabsContent value="traffic" className="space-y-4">
                                {trafficProds.slice(0, 5).map((product: any, idx: number) => (
                                    <div key={idx} className="flex items-center justify-between p-3 rounded-xl hover:bg-indigo-50/50 transition-all border border-transparent hover:border-indigo-100 group">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-sm text-gray-900 group-hover:text-indigo-700">{product.name}</span>
                                            <span className="text-[10px] text-gray-400">{product.seller}</span>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xs font-black text-indigo-600">{product.views} vistas</div>
                                        </div>
                                    </div>
                                ))}
                                {trafficProds.length === 0 && <div className="text-center py-4 text-xs text-gray-400 italic">Sem dados.</div>}
                            </TabsContent>
                            <TabsContent value="sales" className="space-y-4">
                                {salesProds.slice(0, 5).map((product: any, idx: number) => (
                                    <div key={idx} className="flex items-center justify-between p-3 rounded-xl hover:bg-emerald-50/50 transition-all border border-transparent hover:border-emerald-100 group">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-sm text-gray-900 group-hover:text-emerald-700">{product.name}</span>
                                            <span className="text-[10px] text-gray-400">{product.seller}</span>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xs font-black text-emerald-600">{product.sales} vendas</div>
                                        </div>
                                    </div>
                                ))}
                                {salesProds.length === 0 && <div className="text-center py-4 text-xs text-gray-400 italic">Sem vendas.</div>}
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
            </div>

            <Card className="bg-indigo-900 border-none shadow-2xl overflow-hidden relative min-h-[300px] flex flex-col">
                <div className="absolute top-[-100px] left-[-100px] w-96 h-96 bg-blue-500/20 rounded-full blur-[100px] pointer-events-none" />
                <div className="absolute bottom-[-100px] right-[-100px] w-96 h-96 bg-indigo-500/20 rounded-full blur-[100px] pointer-events-none" />

                <CardHeader className="relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-800/50 rounded-full border border-indigo-700/50 mb-4 w-fit">
                        <Sparkles className="h-3 w-3 text-indigo-300" />
                        <span className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest">Business Intelligence IA</span>
                    </div>
                    <CardTitle className="text-3xl font-black text-white">Conselheiro Estratégico Master</CardTitle>
                    <p className="text-indigo-200/70 font-medium">Análise macro da plataforma THEADORO.</p>
                </CardHeader>

                <CardContent className="relative z-10 flex-1 flex flex-col justify-center">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
                        {aiTips.map((tip: any, idx: number) => (
                            <div key={idx} className="p-5 rounded-2xl bg-indigo-800/40 border border-indigo-700/50 backdrop-blur-sm hover:bg-indigo-800/60 transition-all group flex gap-4">
                                <div className={cn(
                                    "p-3 rounded-xl h-fit",
                                    tip.color === 'amber' ? 'bg-amber-500/20' : tip.color === 'blue' ? 'bg-blue-500/20' : 'bg-emerald-500/20'
                                )}>
                                    <tip.icon className={cn(
                                        "h-5 w-5",
                                        tip.color === 'amber' ? 'text-amber-400' : tip.color === 'blue' ? 'text-blue-400' : 'text-emerald-400'
                                    )} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-white mb-1 group-hover:translate-x-1 transition-transform">{tip.title}</h4>
                                    <p className="text-sm text-indigo-100/70 leading-relaxed font-medium">{tip.text}</p>
                                </div>
                            </div>
                        ))}

                        <div
                            onClick={() => setChatOpen(true)}
                            className="p-5 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-white/10 transition-all border-dashed group"
                        >
                            <div className="p-3 bg-indigo-700 rounded-full mb-3 group-hover:scale-110 transition-transform">
                                <Search className="h-5 w-5 text-indigo-200" />
                            </div>
                            <h4 className="font-bold text-white">Deep Research Master</h4>
                            <p className="text-xs text-indigo-300 font-medium mt-1">Clique para solicitar uma análise de nicho</p>
                        </div>
                    </div>
                </CardContent>

                <Dialog open={chatOpen} onOpenChange={setChatOpen}>
                    <DialogContent className="sm:max-w-[500px] h-[600px] flex flex-col p-0 border-none bg-indigo-950 text-white overflow-hidden">
                        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
                        <DialogHeader className="p-6 pb-4 bg-indigo-900/50">
                            <DialogTitle className="flex items-center gap-2 text-white text-xl">
                                <Sparkles className="h-6 w-6 text-indigo-400" />
                                Master Intelligence AI
                            </DialogTitle>
                            <DialogDescription className="text-indigo-300 font-medium italic">Assistente particular THEADORO.</DialogDescription>
                        </DialogHeader>

                        <ScrollArea className="flex-1 p-6">
                            <div className="space-y-6">
                                <div className="bg-indigo-900/40 p-4 rounded-2xl text-sm text-indigo-100 border border-indigo-800 max-w-[90%] font-medium">
                                    Bem-vinda de volta. Como posso ajudar na expansão da plataforma hoje?
                                </div>
                                {chatHistory.map((msg, i) => (
                                    <div key={i} className={cn(
                                        "p-4 rounded-2xl text-sm max-w-[90%] font-medium",
                                        msg.role === 'user' ? "bg-white/10 ml-auto text-white" : "bg-indigo-900/40 text-indigo-100"
                                    )}>
                                        {msg.content}
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>

                        <div className="p-6 bg-indigo-900/50 border-t border-indigo-800">
                            <div className="flex gap-3">
                                <Input
                                    placeholder="Pergunte sobre tendências..."
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleChat()}
                                    className="bg-indigo-950/50 border-indigo-800 text-white"
                                />
                                <Button onClick={handleChat} className="bg-indigo-600">Processar</Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </Card>
        </div>
    );
};

export default AdminInsights;

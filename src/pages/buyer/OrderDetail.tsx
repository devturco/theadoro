import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
    ArrowLeft,
    Package,
    Truck,
    CheckCircle,
    MapPin,
    CreditCard,
    Gift,
    Clock,
    ExternalLink,
    ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function OrderDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user && id) {
            loadOrderDetails();
        }
    }, [user, id]);

    const loadOrderDetails = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('orders')
                .select(`
          *,
          order_items (
            *,
            products (*)
          )
        `)
                .eq('id', id)
                .single();

            if (error) throw error;

            // Parse JSON fields
            const parsedOrder = {
                ...data,
                shipping_address: typeof data.shipping_address === 'string' ? JSON.parse(data.shipping_address) : data.shipping_address,
                notes: typeof data.notes === 'string' ? JSON.parse(data.notes) : data.notes
            };

            setOrder(parsedOrder);
        } catch (error) {
            console.error('Error loading order:', error);
            navigate('/buyer/orders');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!order) return null;

    const steps = [
        { label: 'Pendente', icon: Clock, status: 'pending' },
        { label: 'Confirmado', icon: CheckCircle, status: 'confirmed' },
        { label: 'Processando', icon: Package, status: 'processing' },
        { label: 'Enviado', icon: Truck, status: 'shipped' },
        { label: 'Entregue', icon: CheckCircle, status: 'delivered' },
    ];

    const currentStepIndex = steps.findIndex(s => s.status === order.status);

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-12">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate('/buyer/orders')}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold">Pedido #{order.id.slice(0, 8)}</h1>
                    <p className="text-muted-foreground">Realizado em {formatDate(order.created_at)}</p>
                </div>
                <div className="ml-auto">
                    <Badge className="text-sm px-3 py-1">
                        {steps[currentStepIndex]?.label || order.status}
                    </Badge>
                </div>
            </div>

            {/* Progress Timeline */}
            <Card>
                <CardContent className="pt-8 pb-12">
                    <div className="relative flex justify-between items-center px-4 md:px-12">
                        {/* Progress Bar Background */}
                        <div className="absolute left-0 right-0 top-1/2 h-1 bg-gray-100 -translate-y-1/2 mx-12 hidden md:block"></div>

                        {/* Active Progress Bar */}
                        <div
                            className="absolute left-0 top-1/2 h-1 bg-primary -translate-y-1/2 transition-all duration-500 mx-12 hidden md:block"
                            style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
                        ></div>

                        {steps.map((step, index) => {
                            const Icon = step.icon;
                            const isCompleted = index <= currentStepIndex;
                            const isCurrent = index === currentStepIndex;

                            return (
                                <div key={step.status} className="relative flex flex-col items-center z-10">
                                    <div className={cn(
                                        "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors duration-300",
                                        isCompleted ? "bg-primary border-primary text-white" : "bg-white border-gray-200 text-gray-400",
                                        isCurrent && "ring-4 ring-primary/20 scale-110"
                                    )}>
                                        <Icon className="h-5 w-5" />
                                    </div>
                                    <span className={cn(
                                        "absolute top-12 text-xs font-medium whitespace-nowrap text-center",
                                        isCompleted ? "text-primary" : "text-gray-400"
                                    )}>
                                        {step.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Order Items */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Package className="h-5 w-5" />
                                Produtos ({order.order_items.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {order.order_items.map((item: any) => (
                                <div key={item.id} className="flex gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                                    <div className="w-20 h-20 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                                        <img
                                            src={item.products?.images?.[0] || 'https://via.placeholder.com/150'}
                                            alt={item.products?.name}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div className="flex-1 flex flex-col justify-between">
                                        <div>
                                            <h3 className="font-semibold text-gray-900 line-clamp-1">{item.products?.name}</h3>
                                            <p className="text-sm text-muted-foreground flex items-center gap-2">
                                                Qtd: {item.quantity} • {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.unit_price)}
                                            </p>
                                        </div>
                                        {item.gift_message && (
                                            <div className="mt-2 text-xs bg-amber-50 text-amber-900 p-2 rounded flex items-center gap-2">
                                                <Gift className="h-3 w-3" />
                                                "{item.gift_message}"
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-right flex flex-col items-end justify-center">
                                        <span className="font-bold text-lg">
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.unit_price * item.quantity)}
                                        </span>
                                        <Button variant="ghost" size="sm" asChild className="h-8 mt-1 p-0 px-2">
                                            <Link to={`/products/${item.product_id}`} className="text-xs text-primary flex items-center gap-1">
                                                Ver produto <ChevronRight className="h-3 w-3" />
                                            </Link>
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Tracking */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Truck className="h-5 w-5" />
                                Rastreamento
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <p className="text-sm font-medium text-blue-900">Método de Envio</p>
                                        <p className="text-blue-700 font-bold">{order.shipping_method || 'Entrega Padrão'}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-medium text-blue-900">Previsão de Entrega</p>
                                        <p className="text-blue-700 font-bold">18 de Janeiro, 2026</p>
                                    </div>
                                </div>

                                {order.status === 'shipped' || order.status === 'delivered' ? (
                                    <div className="flex items-center gap-2 text-sm">
                                        <span className="font-semibold text-blue-800">Código:</span>
                                        <code className="bg-white px-2 py-0.5 rounded border text-blue-900">THEA-987-654-BR</code>
                                        <Button variant="link" size="sm" className="h-auto p-0 text-blue-800 underline">
                                            Copiar
                                        </Button>
                                    </div>
                                ) : (
                                    <p className="text-sm text-blue-600">O código será gerado assim que o vendedor despachar seu produto.</p>
                                )}
                            </div>

                            {/* Fake Tracking History */}
                            <div className="space-y-4">
                                <div className="flex gap-4">
                                    <div className="flex flex-col items-center">
                                        <div className="w-2.5 h-2.5 bg-primary rounded-full"></div>
                                        <div className="w-0.5 h-full bg-gray-200 mt-1"></div>
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold">Pedido Confirmado</p>
                                        <p className="text-xs text-muted-foreground">{formatDate(order.created_at)}</p>
                                    </div>
                                </div>
                                {order.status !== 'pending' && (
                                    <div className="flex gap-4">
                                        <div className="flex flex-col items-center">
                                            <div className="w-2.5 h-2.5 bg-primary rounded-full"></div>
                                            <div className="w-0.5 h-full bg-gray-200 mt-1"></div>
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold">Pagamento Aprovado</p>
                                            <p className="text-xs text-muted-foreground">14 de Janeiro, 16:30</p>
                                        </div>
                                    </div>
                                )}
                                {order.status === 'processing' && (
                                    <div className="flex gap-4">
                                        <div className="flex flex-col items-center">
                                            <div className="w-2.5 h-2.5 bg-blue-400 rounded-full animate-pulse"></div>
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold">O vendedor está preparando sua encomenda</p>
                                            <p className="text-xs text-muted-foreground">Em andamento</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    {/* Summary */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Resumo</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Subtotal</span>
                                <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.total_amount - (order.shipping_cost || 0))}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Frete</span>
                                <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.shipping_cost || 0)}</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between font-bold text-lg">
                                <span>Total</span>
                                <span className="text-primary">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.total_amount)}</span>
                            </div>

                            <div className="pt-4 space-y-2">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <CreditCard className="h-4 w-4" />
                                    <span>Pago via {order.payment_method?.toUpperCase()}</span>
                                </div>
                                {order.payment_method === 'pix' && (
                                    <Badge variant="outline" className="w-full justify-center py-2 border-green-200 bg-green-50 text-green-700">
                                        Sincronizado via PIX
                                    </Badge>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Delivery Address */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <MapPin className="h-5 w-5" />
                                Entrega
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {order.shipping_address ? (
                                <div className="text-sm space-y-1">
                                    <p className="font-bold">{order.notes?.customer?.firstName} {order.notes?.customer?.lastName}</p>
                                    <p>{order.shipping_address.street}, {order.shipping_address.number}</p>
                                    {order.shipping_address.complement && <p>{order.shipping_address.complement}</p>}
                                    <p>{order.shipping_address.neighborhood}</p>
                                    <p>{order.shipping_address.city} - {order.shipping_address.state}</p>
                                    <p>{order.shipping_address.zipCode}</p>
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground italic">Endereço não disponível</p>
                            )}
                        </CardContent>
                    </Card>

                    <div className="space-y-3">
                        <Button variant="outline" className="w-full" size="lg">
                            Preciso de ajuda com o pedido
                        </Button>
                        <Button variant="ghost" className="w-full text-muted-foreground" size="sm">
                            Imprimir Recibo
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

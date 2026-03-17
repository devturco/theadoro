import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@theadoro/ui';
import { Button } from '@theadoro/ui';
import { Badge } from '@theadoro/ui';
import { Separator } from '@theadoro/ui';
import { useAuth } from '@/contexts/AuthContext';
import { useOrders } from '@/hooks/useOrders';
import { Order } from '@/types/order';
import {
    ArrowLeft,
    Package,
    Truck,
    CheckCircle,
    MapPin,
    CreditCard,
    Gift,
    Clock,
    MessageCircle,
    ChevronRight,
    ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function OrderDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { getOrder, loading } = useOrders();
    const [order, setOrder] = useState<Order | null>(null);

    useEffect(() => {
        if (user && id) {
            loadOrderDetails();
        }
    }, [user, id]);

    const loadOrderDetails = async () => {
        if (!id) return;
        const data = await getOrder(id);
        if (data) {
            setOrder(data);
        } else {
            toast.error('Pedido não encontrado');
            navigate('/buyer/orders');
        }
    };

    if (loading && !order) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!order) return null;

    // Helper to safely access parsed notes and address
    // OrderService/Supabase might return these as strings or objects depending on client config
    const notes = order.notes ? (typeof order.notes === 'string' ? JSON.parse(order.notes) : order.notes) : {};
    const shippingAddress = order.shipping_address ? (typeof order.shipping_address === 'string' ? JSON.parse(order.shipping_address) : order.shipping_address) : null;

    // Derived values
    const giftWrapPrice = notes.gift_wrap_price || notes.giftWrapPrice || 0;
    const shippingCost = order.shipping_cost || notes.shipping_cost || notes.shippingCost || 0;
    const discountAmount = order.discount_amount || notes.discount_amount || notes.discountAmount || 0;
    const subtotal = order.subtotal || notes.subtotal || notes.subtotal_amount ||
        (order.total_amount - shippingCost - giftWrapPrice + discountAmount);

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
                            style={{ width: `${(Math.max(0, currentStepIndex) / (steps.length - 1)) * 100}%` }}
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
                                Produtos ({order.items?.length || 0})
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {order.items?.map((item: any) => (
                                <div key={item.id} className="flex gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                                    <div className="w-20 h-20 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                                        <img
                                            src={item.product?.images?.[0] || 'https://via.placeholder.com/150'}
                                            alt={item.product?.name}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div className="flex-1 flex flex-col justify-between">
                                        <div>
                                            <h3 className="font-semibold text-gray-900 line-clamp-1">{item.product?.name}</h3>
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
                                        <p className="text-blue-700 font-bold">{notes.shipping_method || 'Entrega Padrão'}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-medium text-blue-900">Previsão de Entrega</p>
                                        <p className="text-blue-700 font-bold">
                                            {order.estimated_delivery ? new Date(order.estimated_delivery).toLocaleDateString('pt-BR') : 'A definir'}
                                        </p>
                                    </div>
                                </div>

                                {order.status === 'shipped' || order.status === 'delivered' ? (
                                    <div className="flex items-center gap-2 text-sm">
                                        <span className="font-semibold text-blue-800">Código:</span>
                                        <code className="bg-white px-2 py-0.5 rounded border text-blue-900">{order.tracking_number || 'Não disponível'}</code>
                                        {order.tracking_number && (
                                            <Button variant="link" size="sm" className="h-auto p-0 text-blue-800 underline">
                                                Copiar
                                            </Button>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-sm text-blue-600">O código será gerado assim que o vendedor despachar seu produto.</p>
                                )}
                            </div>

                            {/* Tracking History */}
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
                                <span className="text-muted-foreground">Produtos</span>
                                <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(subtotal)}</span>
                            </div>
                            {(giftWrapPrice > 0) && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground flex items-center gap-1">
                                        Embalagem para presente
                                    </span>
                                    <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(giftWrapPrice)}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Frete</span>
                                <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(shippingCost)}</span>
                            </div>
                            {(discountAmount > 0) && (
                                <div className="flex justify-between text-sm text-green-600">
                                    <span className="flex items-center gap-1">
                                        Desconto
                                    </span>
                                    <span>-{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(discountAmount)}</span>
                                </div>
                            )}
                            <Separator />
                            <div className="flex justify-between font-bold text-lg">
                                <span>Total</span>
                                <span className="text-primary">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.total_amount)}</span>
                            </div>

                            <div className="pt-4 space-y-2">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <CreditCard className="h-4 w-4" />
                                    <span>Pago via {(order.payment_method || 'Desconhecido').toUpperCase()}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Gift Options */}
                    {notes?.giftOptions?.is_gift && (
                        <Card className="border-purple-200 bg-purple-50/30">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg flex items-center gap-2 text-purple-900">
                                    <Gift className="h-5 w-5 text-purple-600" />
                                    Opções de Presente
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="text-sm space-y-4">
                                <div className="flex gap-4">
                                    {notes.giftOptions.wrap_style_image && (
                                        <div className="w-20 h-20 rounded-lg overflow-hidden border bg-gray-50 flex-shrink-0">
                                            <img
                                                src={notes.giftOptions.wrap_style_image}
                                                alt={notes.giftOptions.wrap_style_name}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    )}
                                    <div className="flex-1">
                                        <p className="font-semibold text-purple-800">Embalagem:</p>
                                        <p className="text-purple-700">{notes.giftOptions.wrap_style_name || 'Embalagem Selecionada'}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    {notes.giftOptions.recipient_name && (
                                        <div>
                                            <p className="font-semibold text-purple-800 text-xs uppercase tracking-wider">Para:</p>
                                            <p className="text-purple-700 font-medium">{notes.giftOptions.recipient_name}</p>
                                        </div>
                                    )}
                                    {notes.giftOptions.sender_name && (
                                        <div>
                                            <p className="font-semibold text-purple-800 text-xs uppercase tracking-wider">De:</p>
                                            <p className="text-purple-700 font-medium">{notes.giftOptions.sender_name}</p>
                                        </div>
                                    )}
                                </div>
                                {notes.giftOptions.message && (
                                    <div className="bg-white p-4 rounded-xl border border-purple-100 italic text-purple-900 shadow-sm relative">
                                        <span className="absolute -top-2 left-4 px-2 bg-white text-[10px] font-bold text-purple-300 uppercase leading-none">Mensagem</span>
                                        "{notes.giftOptions.message}"
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Delivery Address */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <MapPin className="h-5 w-5" />
                                Entrega
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {shippingAddress ? (
                                <div className="text-sm space-y-1">
                                    <p className="font-bold">{notes?.customer?.firstName} {notes?.customer?.lastName}</p>
                                    <p>{shippingAddress.street || shippingAddress.address}, {shippingAddress.number}</p>
                                    {shippingAddress.complement && <p>{shippingAddress.complement}</p>}
                                    <p>{shippingAddress.neighborhood}</p>
                                    <p>{shippingAddress.city} - {shippingAddress.state}</p>
                                    <p>{shippingAddress.zipCode || shippingAddress.zip_code}</p>
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground italic">Endereço não disponível</p>
                            )}
                        </CardContent>
                    </Card>

                    <div className="space-y-3">
                        {order.seller?.phone && (
                            <Button
                                variant="outline"
                                className="w-full gap-2"
                                size="lg"
                                onClick={() => {
                                    const phone = order.seller!.phone;
                                    const message = encodeURIComponent(`Olá, preciso de ajuda com o pedido #${order.id.slice(0, 8)}`);
                                    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
                                }}
                            >
                                <MessageCircle className="h-4 w-4" />
                                Falar com Vendedor
                            </Button>
                        )}
                        <Button variant="ghost" className="w-full text-muted-foreground" size="sm" onClick={() => navigate('/buyer/support')}>
                            Problema com o pedido? Fale com o suporte
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

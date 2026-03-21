import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@theadoro/ui';
import { Button } from '@theadoro/ui';
import { Badge } from '@theadoro/ui';
import { Separator } from '@theadoro/ui';
import { useAuth } from '@/contexts/AuthContext';
import { useOrders } from '@/hooks/useOrders';
import { usePixCountdown } from '@/hooks/usePixCountdown';
import { cancelExpiredPixOrder, regeneratePixForOrder } from '@/services/pixOrder.service';
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
    Copy,
    Loader2,
    RefreshCcw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function OrderDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { getOrder, loading } = useOrders();
    const [order, setOrder] = useState<Order | null>(null);
    const [regeneratingPix, setRegeneratingPix] = useState(false);
    const [cancellingExpiredOrder, setCancellingExpiredOrder] = useState(false);
    const [cancelAttemptFailed, setCancelAttemptFailed] = useState(false);

    const loadOrderDetails = useCallback(async () => {
        if (!id) return;
        const data = await getOrder(id);
        if (data) {
            setOrder(data);
        } else {
            toast.error('Pedido não encontrado');
            navigate('/buyer/orders');
        }
    }, [getOrder, id, navigate]);

    useEffect(() => {
        if (user && id) {
            loadOrderDetails();
        }
    }, [id, loadOrderDetails, user]);

    const notes = useMemo(
        () => order?.notes ? (typeof order.notes === 'string' ? JSON.parse(order.notes) : order.notes) : {},
        [order?.notes]
    );
    const shippingAddress = useMemo(
        () => order?.shipping_address ? (typeof order.shipping_address === 'string' ? JSON.parse(order.shipping_address) : order.shipping_address) : null,
        [order?.shipping_address]
    );
    const latestPayment = useMemo(() => {
        if (!order?.payments?.length) return null;

        return [...order.payments].sort((a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0];
    }, [order?.payments]);
    const latestPaymentMetadata = useMemo(() => {
        if (!latestPayment?.metadata) return {};

        return typeof latestPayment.metadata === 'string'
            ? JSON.parse(latestPayment.metadata)
            : latestPayment.metadata;
    }, [latestPayment?.metadata]);

    const giftWrapPrice = notes.gift_wrap_price || notes.giftWrapPrice || 0;
    const shippingCost = order?.shipping_cost || notes.shipping_cost || notes.shippingCost || 0;
    const discountAmount = order?.discount_amount || notes.discount_amount || notes.discountAmount || 0;
    const trackingNumber =
        notes?.tracking_number ||
        notes?.trackingNumber ||
        notes?.fulfillment?.tracking_number ||
        notes?.fulfillment?.trackingNumber ||
        order?.tracking_number ||
        '';
    const subtotal = order?.subtotal || notes.subtotal || notes.subtotal_amount ||
        ((order?.total_amount || 0) - shippingCost - giftWrapPrice + discountAmount);
    const paymentInfo = {
        ...(notes?.paymentInfo || {}),
        id: latestPaymentMetadata.providerTransactionId || latestPayment?.provider_transaction_id || notes?.paymentInfo?.id,
        pixCode: latestPaymentMetadata.pixCode || notes?.paymentInfo?.pixCode,
        pixUrl: latestPaymentMetadata.pixUrl || notes?.paymentInfo?.pixUrl,
        pixExpiration: latestPaymentMetadata.pixExpiration || notes?.paymentInfo?.pixExpiration,
        cancelAt: latestPaymentMetadata.cancelAt || notes?.paymentInfo?.cancelAt,
        status:
            notes?.paymentInfo?.status === 'expired'
                ? 'expired'
                : latestPayment?.status || notes?.paymentInfo?.status,
        gatewayErrorMessage:
            latestPaymentMetadata.gatewayErrorMessage ||
            latestPaymentMetadata.gatewayResponse?.charges?.[0]?.last_transaction?.gateway_response?.errors?.[0]?.message ||
            notes?.paymentInfo?.gatewayErrorMessage,
    };
    const paymentMethod = (order?.payment_method || '').toLowerCase();
    const isPixPayment = paymentMethod === 'pix';
    const isCardPayment = ['credit', 'credit_card', 'debit', 'debit_card'].includes(paymentMethod);
    const orderCancelled = order?.status === 'cancelled';
    const paymentFailed = paymentInfo.status === 'failed';
    const paymentExpired = paymentInfo.status === 'expired';
    const paymentApproved =
        !orderCancelled &&
        !paymentFailed &&
        !paymentExpired &&
        (['approved', 'paid', 'succeeded'].includes(paymentInfo.status) || ['confirmed', 'processing', 'shipped', 'delivered'].includes(order?.status || ''));
    const displayOrderStatus = (() => {
        if (orderCancelled) return 'cancelled';
        if (['confirmed', 'processing', 'shipped', 'delivered'].includes(order?.status || '')) return order!.status;
        if (paymentApproved) return 'processing';
        return 'pending';
    })();
    const paymentPending =
        !orderCancelled &&
        !paymentFailed &&
        !paymentExpired &&
        !paymentApproved;
    const pixCode = paymentInfo.pixCode || '';
    const pixExpiration = paymentInfo.pixExpiration || '';
    const pixCancelAt = paymentInfo.cancelAt || '';
    const gatewayErrorMessage = paymentInfo.gatewayErrorMessage || '';
    const paymentMethodLabel = isPixPayment
        ? 'PIX'
        : isCardPayment
            ? 'cartão'
            : (order?.payment_method || 'pagamento');
    const pixLifecycle = usePixCountdown(
        {
            pixExpiration,
            cancelAt: pixCancelAt,
            status: paymentInfo.status,
        },
        isPixPayment && displayOrderStatus === 'pending'
    );

    const qrCodeUrl = paymentInfo.pixUrl
        ? paymentInfo.pixUrl
        : pixCode
            ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(pixCode)}`
            : '';

    useEffect(() => {
        if (!pixLifecycle.isCancellationDue || order?.status !== 'pending') {
            setCancelAttemptFailed(false);
        }
    }, [order?.status, pixLifecycle.isCancellationDue]);

    useEffect(() => {
        if (!id || !user) return;

        const shouldAutoRefresh =
            displayOrderStatus === 'pending' ||
            displayOrderStatus === 'processing' ||
            order?.status === 'confirmed';

        if (!shouldAutoRefresh) return;

        const intervalId = window.setInterval(() => {
            if (document.visibilityState === 'visible') {
                loadOrderDetails();
            }
        }, 12000);

        return () => window.clearInterval(intervalId);
    }, [displayOrderStatus, id, loadOrderDetails, order?.status, user]);

    useEffect(() => {
        if (!id || !user) return;

        const handleFocusRefresh = () => {
            if (document.visibilityState === 'visible') {
                void loadOrderDetails();
            }
        };

        window.addEventListener('focus', handleFocusRefresh);
        document.addEventListener('visibilitychange', handleFocusRefresh);

        return () => {
            window.removeEventListener('focus', handleFocusRefresh);
            document.removeEventListener('visibilitychange', handleFocusRefresh);
        };
    }, [id, loadOrderDetails, user]);

    const steps = [
        { label: 'Pendente', icon: Clock, status: 'pending' },
        { label: 'Confirmado', icon: CheckCircle, status: 'confirmed' },
        { label: 'Processando', icon: Package, status: 'processing' },
        { label: 'Enviado', icon: Truck, status: 'shipped' },
        { label: 'Entregue', icon: CheckCircle, status: 'delivered' },
    ];

    const currentStepIndex = steps.findIndex(s => s.status === displayOrderStatus);
    const currentStepLabel = steps[currentStepIndex]?.label || displayOrderStatus;
    const paymentSummaryLabel = paymentFailed
        ? 'Pagamento recusado'
        : paymentExpired
            ? 'PIX expirado'
            : paymentApproved
                ? 'Pagamento aprovado'
                : 'Pagamento pendente';

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleCopyPix = async () => {
        if (!pixCode) return;

        try {
            await navigator.clipboard.writeText(pixCode);
            toast.success('Código PIX copiado!');
        } catch (error) {
            toast.error('Não foi possível copiar o código PIX.');
        }
    };

    useEffect(() => {
        const syncExpiredOrder = async () => {
            if (
                !id ||
                !isPixPayment ||
                order?.status !== 'pending' ||
                !pixLifecycle.isCancellationDue ||
                cancellingExpiredOrder ||
                cancelAttemptFailed
            ) {
                return;
            }

            try {
                setCancellingExpiredOrder(true);
                await cancelExpiredPixOrder(id);
                await loadOrderDetails();
            } catch (error) {
                setCancelAttemptFailed(true);
                console.error('Erro ao cancelar pedido PIX expirado:', error);
            } finally {
                setCancellingExpiredOrder(false);
            }
        };

        syncExpiredOrder();
    }, [cancelAttemptFailed, cancellingExpiredOrder, id, isPixPayment, order?.status, pixLifecycle.isCancellationDue]);

    const handleRegeneratePix = async () => {
        if (!id) return;

        try {
            setRegeneratingPix(true);
            await regeneratePixForOrder(id);
            await loadOrderDetails();
            toast.success('Novo PIX gerado com sucesso.');
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Não foi possível gerar um novo PIX.';
            toast.error(message);
        } finally {
            setRegeneratingPix(false);
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
                    <Badge className={cn(
                        'text-sm px-3 py-1',
                        paymentFailed || paymentExpired || orderCancelled
                            ? 'bg-red-100 text-red-700 hover:bg-red-100'
                            : paymentApproved
                                ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100'
                                : 'bg-amber-100 text-amber-700 hover:bg-amber-100'
                    )}>
                        {currentStepLabel}
                    </Badge>
                </div>
            </div>

            <Card>
                <CardContent className="pt-8 pb-12">
                    <div className="relative flex justify-between items-center px-4 md:px-12">
                        <div className="absolute left-0 right-0 top-1/2 h-1 bg-gray-100 -translate-y-1/2 mx-12 hidden md:block"></div>
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
                                        'w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors duration-300',
                                        isCompleted ? 'bg-primary border-primary text-white' : 'bg-white border-gray-200 text-gray-400',
                                        isCurrent && 'ring-4 ring-primary/20 scale-110'
                                    )}>
                                        <Icon className="h-5 w-5" />
                                    </div>
                                    <span className={cn(
                                        'absolute top-12 text-xs font-medium whitespace-nowrap text-center',
                                        isCompleted ? 'text-primary' : 'text-gray-400'
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
                                        <p className="text-sm font-medium text-blue-900">Método de envio</p>
                                        <p className="text-blue-700 font-bold">{notes.shipping_method || 'Entrega padrão'}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-medium text-blue-900">Previsão de entrega</p>
                                        <p className="text-blue-700 font-bold">
                                            {order.estimated_delivery ? new Date(order.estimated_delivery).toLocaleDateString('pt-BR') : 'A definir'}
                                        </p>
                                    </div>
                                </div>
                                {order.status === 'shipped' || order.status === 'delivered' ? (
                                    <div className="flex items-center gap-2 text-sm">
                                        <span className="font-semibold text-blue-800">Código:</span>
                                        <code className="bg-white px-2 py-0.5 rounded border text-blue-900">{trackingNumber || 'Não disponível'}</code>
                                        {trackingNumber && (
                                            <Button variant="link" size="sm" className="h-auto p-0 text-blue-800 underline">
                                                Copiar
                                            </Button>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-sm text-blue-600">O código será gerado assim que o vendedor despachar seu produto.</p>
                                )}
                            </div>
                            <div className="space-y-4">
                                <div className="flex gap-4">
                                    <div className="flex flex-col items-center">
                                        <div className="w-2.5 h-2.5 bg-primary rounded-full"></div>
                                        <div className="w-0.5 h-full bg-gray-200 mt-1"></div>
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold">Pedido criado</p>
                                        <p className="text-xs text-muted-foreground">{formatDate(order.created_at)}</p>
                                    </div>
                                </div>
                                {paymentPending && (
                                    <div className="flex gap-4">
                                        <div className="flex flex-col items-center">
                                            <div className="w-2.5 h-2.5 bg-amber-500 rounded-full"></div>
                                            <div className="w-0.5 h-full bg-gray-200 mt-1"></div>
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold">Aguardando pagamento</p>
                                            <p className="text-xs text-muted-foreground">
                                                Assim que o pagamento for confirmado, o pedido avança automaticamente.
                                            </p>
                                        </div>
                                    </div>
                                )}
                                {(paymentFailed || paymentExpired || orderCancelled || paymentApproved) && (
                                    <div className="flex gap-4">
                                        <div className="flex flex-col items-center">
                                            <div className={cn(
                                                'w-2.5 h-2.5 rounded-full',
                                                paymentFailed || paymentExpired || orderCancelled ? 'bg-red-500' : 'bg-primary'
                                            )}></div>
                                            <div className="w-0.5 h-full bg-gray-200 mt-1"></div>
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold">
                                                {paymentFailed
                                                    ? 'Pagamento recusado'
                                                    : paymentExpired
                                                        ? 'PIX expirado'
                                                        : orderCancelled
                                                            ? 'Pedido cancelado'
                                                            : 'Pagamento aprovado'}
                                            </p>
                                            {(paymentFailed || paymentExpired || orderCancelled) && (
                                                <p className="text-xs text-muted-foreground">
                                                    {gatewayErrorMessage || 'O pedido não seguiu para processamento.'}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}
                                {paymentApproved && displayOrderStatus === 'processing' && (
                                    <div className="flex gap-4">
                                        <div className="flex flex-col items-center">
                                            <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></div>
                                            <div className="w-0.5 h-full bg-gray-200 mt-1"></div>
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold">Pedido em preparação</p>
                                            <p className="text-xs text-muted-foreground">
                                                O pagamento já foi aprovado e o vendedor pode separar e preparar o envio.
                                            </p>
                                        </div>
                                    </div>
                                )}
                                {order.status === 'shipped' && (
                                    <div className="flex gap-4">
                                        <div className="flex flex-col items-center">
                                            <div className="w-2.5 h-2.5 bg-primary rounded-full"></div>
                                            <div className="w-0.5 h-full bg-gray-200 mt-1"></div>
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold">Pedido enviado</p>
                                            <p className="text-xs text-muted-foreground">
                                                Seu pedido já foi despachado e o rastreio aparece assim que estiver disponível.
                                            </p>
                                        </div>
                                    </div>
                                )}
                                {order.status === 'delivered' && (
                                    <div className="flex gap-4">
                                        <div className="flex flex-col items-center">
                                            <div className="w-2.5 h-2.5 bg-emerald-600 rounded-full"></div>
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold">Pedido entregue</p>
                                            <p className="text-xs text-muted-foreground">
                                                A entrega foi concluída com sucesso.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
                <div className="space-y-6">
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
                                    <span>Pagamento via {paymentMethodLabel.toUpperCase()}</span>
                                </div>
                                <p className={cn(
                                    'text-sm font-medium',
                                    paymentFailed || paymentExpired ? 'text-red-600' : paymentApproved ? 'text-green-600' : 'text-amber-600'
                                )}>
                                    {paymentSummaryLabel}
                                </p>
                                {paymentApproved && displayOrderStatus === 'processing' && (
                                    <p className="text-xs text-muted-foreground">
                                        Pedido em preparação. Esta página se atualiza automaticamente.
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className={cn(
                        paymentFailed || paymentExpired
                            ? 'border-red-200 bg-red-50/40'
                            : paymentPending
                                ? 'border-amber-200 bg-amber-50/40'
                                : 'border-green-200 bg-green-50/40'
                    )}>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <CreditCard className="h-5 w-5" />
                                Pagamento
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {paymentFailed ? (
                                <>
                                    <p className="text-sm text-red-700">
                                        O pagamento foi recusado e este pedido ainda não pode seguir para processamento.
                                    </p>
                                    {gatewayErrorMessage && (
                                        <div className="rounded-lg border border-red-200 bg-white p-3 text-sm text-red-800">
                                            {gatewayErrorMessage}
                                        </div>
                                    )}
                                </>
                            ) : paymentExpired ? (
                                <p className="text-sm text-red-700">
                                    O PIX expirou e o pedido foi cancelado automaticamente porque nenhum novo código foi gerado a tempo.
                                </p>
                            ) : paymentPending && isPixPayment ? (
                                <>
                                    <p className="text-sm text-amber-800">
                                        O pagamento via PIX ainda não foi confirmado.
                                        Se você já pagou, aguarde alguns minutos que esta tela vai mudar automaticamente.
                                        Se ainda não pagou, use as informações abaixo.
                                    </p>
                                    {!pixLifecycle.isExpired && pixLifecycle.formattedExpirationCountdown && (
                                        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center">
                                            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
                                                Pague em até
                                            </p>
                                            <p className="mt-1 text-4xl font-bold tabular-nums text-emerald-900">
                                                {pixLifecycle.formattedExpirationCountdown}
                                            </p>
                                            <p className="mt-2 text-sm text-emerald-800">
                                                Depois disso, o QR Code expira.
                                            </p>
                                        </div>
                                    )}
                                    {pixLifecycle.isInGracePeriod && pixLifecycle.formattedCancellationCountdown && (
                                        <div className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-4 text-center">
                                            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">
                                                PIX expirado
                                            </p>
                                            <p className="mt-1 text-3xl font-bold tabular-nums text-amber-900">
                                                {pixLifecycle.formattedCancellationCountdown}
                                            </p>
                                            <p className="mt-2 text-sm text-amber-800">
                                                Você ainda pode gerar um novo PIX antes do cancelamento automático do pedido.
                                            </p>
                                        </div>
                                    )}
                                    {qrCodeUrl && !pixLifecycle.isExpired && (
                                        <div className="flex justify-center rounded-xl border bg-white p-4">
                                            <img src={qrCodeUrl} alt="QR Code PIX" className="h-48 w-48 max-w-full" />
                                        </div>
                                    )}
                                    {pixCode && (
                                        <div className="space-y-2">
                                            <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Copia e cola</p>
                                            <div className="rounded-xl border bg-white p-3 text-sm text-gray-700 break-all">
                                                {pixCode}
                                            </div>
                                            <Button type="button" variant="outline" className="w-full" onClick={handleCopyPix} disabled={pixLifecycle.isExpired}>
                                                <Copy className="mr-2 h-4 w-4" />
                                                Copiar código PIX
                                            </Button>
                                        </div>
                                    )}
                                    <div className="space-y-1 text-xs text-amber-700">
                                        {pixExpiration && (
                                            <p>QR Code expira em {new Date(pixExpiration).toLocaleString('pt-BR')}.</p>
                                        )}
                                        {pixLifecycle.cancelAt && (
                                            <p>Cancelamento automático do pedido em {new Date(pixLifecycle.cancelAt).toLocaleString('pt-BR')}.</p>
                                        )}
                                    </div>
                                    {pixLifecycle.isInGracePeriod && (
                                        <Button type="button" className="w-full" onClick={handleRegeneratePix} disabled={regeneratingPix}>
                                            {regeneratingPix ? (
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            ) : (
                                                <RefreshCcw className="mr-2 h-4 w-4" />
                                            )}
                                            Gerar novo PIX
                                        </Button>
                                    )}
                                </>
                            ) : paymentPending && isCardPayment ? (
                                <p className="text-sm text-amber-800">
                                    Seu pagamento com cartão foi enviado para processamento.
                                    Se você já concluiu a compra, aguarde alguns minutos que esta tela será atualizada.
                                </p>
                            ) : paymentApproved && displayOrderStatus === 'processing' ? (
                                <div className="space-y-3">
                                    <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-100/70 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-800">
                                        <CheckCircle className="h-3.5 w-3.5" />
                                        Acompanhamento em tempo real
                                    </div>
                                    <p className="text-sm text-green-700">
                                        Pagamento aprovado. Seu pedido já entrou em preparação e esta página acompanha automaticamente as próximas mudanças de status.
                                    </p>
                                    <p className="text-sm text-green-700/90">
                                        Assim que o vendedor despachar, o andamento aqui mudará para envio e o rastreio aparecerá nesta mesma tela.
                                    </p>
                                </div>
                            ) : (
                                <p className="text-sm text-green-700">
                                    Pagamento confirmado. O pedido já pode seguir normalmente para processamento e envio.
                                </p>
                            )}
                        </CardContent>
                    </Card>
                    {notes?.giftOptions?.is_gift && (
                        <Card className="border-purple-200 bg-purple-50/30">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg flex items-center gap-2 text-purple-900">
                                    <Gift className="h-5 w-5 text-purple-600" />
                                    Opções de presente
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
                                        <p className="text-purple-700">{notes.giftOptions.wrap_style_name || 'Embalagem selecionada'}</p>
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
                                Falar com vendedor
                            </Button>
                        )}
                        <Button variant="ghost" className="w-full text-muted-foreground" size="sm" onClick={() => navigate('/buyer/support')}>
                            Problema com o pedido? Fale com o suporte
                        </Button>
                        <Button variant="ghost" className="w-full text-muted-foreground" size="sm">
                            Imprimir recibo
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

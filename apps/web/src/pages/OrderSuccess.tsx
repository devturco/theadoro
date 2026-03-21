import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    CheckCircle,
    Copy,
    CreditCard,
    Home,
    Loader2,
    QrCode,
    RefreshCcw,
    ShoppingBag,
} from 'lucide-react';
import { Button } from '@theadoro/ui';
import { useCheckout, Order } from '@/hooks/useCheckout';
import { usePixCountdown } from '@/hooks/usePixCountdown';
import { cancelExpiredPixOrder, regeneratePixForOrder } from '@/services/pixOrder.service';
import { toast } from 'sonner';

const OrderSuccess: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { getOrderById } = useCheckout();

    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [regeneratingPix, setRegeneratingPix] = useState(false);
    const [cancellingExpiredOrder, setCancellingExpiredOrder] = useState(false);
    const [cancelAttemptFailed, setCancelAttemptFailed] = useState(false);

    useEffect(() => {
        const loadOrder = async () => {
            if (!id) {
                setLoading(false);
                return;
            }

            const foundOrder = await getOrderById(id);
            setOrder(foundOrder);
            setLoading(false);
        };

        loadOrder();
    }, [getOrderById, id]);

    const isPix = order?.checkoutData.paymentMethod === 'pix';
    const isCardPayment = !isPix;
    const pixCode = order?.paymentInfo?.pixCode || '';
    const pixExpiration = order?.paymentInfo?.pixExpiration || '';
    const pixCancelAt = order?.paymentInfo?.cancelAt || '';
    const isTestMode = Boolean(order?.paymentInfo?.isTestMode);
    const paymentFailed = order?.paymentInfo?.status === 'failed';
    const paymentExpired = order?.paymentInfo?.status === 'expired' || order?.status === 'cancelled';
    const gatewayErrorMessage = order?.paymentInfo?.gatewayErrorMessage || '';
    const cardPaymentApproved = isCardPayment && !paymentFailed && !paymentExpired;
    const pixLifecycle = usePixCountdown(
        {
            pixExpiration,
            cancelAt: pixCancelAt,
            status: order?.paymentInfo?.status,
        },
        isPix && order?.status === 'pending'
    );

    const qrCodeUrl = useMemo(() => {
        if (order?.paymentInfo?.pixUrl) return order.paymentInfo.pixUrl;
        if (!pixCode) return '';

        return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(pixCode)}`;
    }, [order?.paymentInfo?.pixUrl, pixCode]);

    useEffect(() => {
        if (!pixLifecycle.isCancellationDue || order?.status !== 'pending') {
            setCancelAttemptFailed(false);
        }
    }, [order?.status, pixLifecycle.isCancellationDue]);

    useEffect(() => {
        const syncExpiredOrder = async () => {
            if (
                !id ||
                !isPix ||
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
                const refreshedOrder = await getOrderById(id);
                setOrder(refreshedOrder);
            } catch (error) {
                setCancelAttemptFailed(true);
                console.error('Erro ao cancelar pedido PIX expirado:', error);
            } finally {
                setCancellingExpiredOrder(false);
            }
        };

        syncExpiredOrder();
    }, [cancelAttemptFailed, cancellingExpiredOrder, getOrderById, id, isPix, order?.status, pixLifecycle.isCancellationDue]);

    const handleCopyPix = async () => {
        if (!pixCode) return;

        try {
            await navigator.clipboard.writeText(pixCode);
            toast.success('Código PIX copiado!');
        } catch (error) {
            toast.error('Não foi possível copiar o código PIX.');
        }
    };

    const handleRegeneratePix = async () => {
        if (!id) return;

        try {
            setRegeneratingPix(true);
            await regeneratePixForOrder(id);
            const refreshedOrder = await getOrderById(id);
            setOrder(refreshedOrder);
            toast.success('Novo PIX gerado com sucesso.');
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Não foi possível gerar um novo PIX.';
            toast.error(message);
        } finally {
            setRegeneratingPix(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 px-4">
                <div className="flex items-center gap-3 text-gray-600">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Carregando pedido...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 px-4 py-10">
            <div className="max-w-xl w-full bg-white p-8 rounded-lg shadow-sm border border-gray-100 text-center space-y-6">
                <div className="flex justify-center">
                    <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="h-10 w-10 text-green-600" />
                    </div>
                </div>

                <div className="space-y-2">
                    <h1 className="text-2xl font-bold text-gray-900">
                        {isPix ? 'Pedido recebido!' : cardPaymentApproved ? 'Pagamento aprovado!' : 'Pedido realizado!'}
                    </h1>
                    <p className="text-gray-600">
                        {paymentFailed
                            ? 'O pedido foi criado, mas o gateway recusou a geração do PIX. Revise os dados e tente novamente.'
                            : paymentExpired
                                ? 'O prazo do PIX terminou e este pedido foi encerrado automaticamente.'
                                : isPix
                                    ? 'Seu pedido foi criado. Agora finalize o pagamento via PIX para liberar o processamento.'
                                    : 'Seu pagamento foi aprovado com sucesso e seu pedido já está em preparação.'}
                    </p>
                    {cardPaymentApproved && (
                        <div className="flex justify-center pt-1">
                            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
                                <CheckCircle className="h-4 w-4" />
                                Compra confirmada e pagamento aprovado
                            </span>
                        </div>
                    )}
                    <div className="pt-2">
                        <span className="text-sm text-gray-500 uppercase tracking-wide">Número do pedido</span>
                        <p className="text-lg font-mono font-medium text-gray-900 select-all">
                            #{id?.slice(0, 8).toUpperCase()}
                        </p>
                    </div>
                </div>

                {isPix && (
                    <div className="space-y-4 rounded-2xl border border-gray-100 bg-gray-50 p-5 text-left">
                        <div className="flex items-start gap-3">
                            <div className="mt-1 rounded-full bg-emerald-100 p-2">
                                <QrCode className="h-5 w-5 text-emerald-700" />
                            </div>
                            <div>
                                <h2 className="font-semibold text-gray-900">Pagamento via PIX</h2>
                                <p className="text-sm text-gray-600">
                                    Escaneie o QR Code ou copie o código abaixo para pagar.
                                </p>
                                {isTestMode && (
                                    <p className="mt-2 text-xs font-medium text-amber-700">
                                        Ambiente em modo teste do Pagar.me.
                                    </p>
                                )}
                            </div>
                        </div>

                        {!paymentFailed && order?.status === 'pending' && !pixLifecycle.isExpired && pixLifecycle.formattedExpirationCountdown && (
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

                        {!paymentFailed && order?.status === 'pending' && pixLifecycle.isInGracePeriod && pixLifecycle.formattedCancellationCountdown && (
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

                        {qrCodeUrl && !pixLifecycle.isExpired && order?.status === 'pending' && (
                            <div className="flex justify-center rounded-xl bg-white p-4">
                                <img
                                    src={qrCodeUrl}
                                    alt="QR Code PIX"
                                    className="h-56 w-56 max-w-full"
                                />
                            </div>
                        )}

                        {paymentFailed ? (
                            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                                {gatewayErrorMessage || 'O gateway recusou a geração do PIX para este pedido.'}
                            </div>
                        ) : paymentExpired ? (
                            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                                Este pedido foi cancelado porque o prazo do PIX terminou sem pagamento.
                            </div>
                        ) : pixCode ? (
                            <div className="space-y-2">
                                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Copia e cola
                                </p>
                                <div className="rounded-xl border bg-white p-3 text-sm text-gray-700 break-all select-all">
                                    {pixCode}
                                </div>
                                <Button
                                    className="w-full"
                                    variant="secondary"
                                    onClick={handleCopyPix}
                                    disabled={pixLifecycle.isExpired}
                                >
                                    <Copy className="mr-2 h-4 w-4" />
                                    Copiar código PIX
                                </Button>
                            </div>
                        ) : (
                            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                                O gateway não retornou o código PIX para exibição. Verifique o pedido no painel admin.
                            </div>
                        )}

                        {pixExpiration && !paymentFailed && (
                            <div className="space-y-1 text-xs text-gray-500">
                                <p>QR Code expira em: {new Date(pixExpiration).toLocaleString('pt-BR')}</p>
                                {pixLifecycle.cancelAt && (
                                    <p>Cancelamento automático do pedido em: {new Date(pixLifecycle.cancelAt).toLocaleString('pt-BR')}</p>
                                )}
                            </div>
                        )}

                        {order?.status === 'pending' && pixLifecycle.isInGracePeriod && (
                            <Button
                                className="w-full"
                                onClick={handleRegeneratePix}
                                disabled={regeneratingPix}
                            >
                                {regeneratingPix ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <RefreshCcw className="mr-2 h-4 w-4" />
                                )}
                                Gerar novo PIX
                            </Button>
                        )}
                    </div>
                )}

                <div className="pt-2 space-y-3">
                    <Button
                        className="w-full bg-blue-600 hover:bg-blue-700"
                        onClick={() => navigate('/buyer/orders')}
                    >
                        <ShoppingBag className="mr-2 h-4 w-4" />
                        Meus pedidos
                    </Button>

                    <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => navigate('/')}
                    >
                        <Home className="mr-2 h-4 w-4" />
                        Voltar para loja
                    </Button>
                </div>

                <div className="text-sm text-gray-500 pt-4 border-t border-gray-100">
                    <p className="flex items-center justify-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        {isPix
                            ? paymentFailed
                                ? 'Esse pedido precisa de uma nova tentativa de pagamento para seguir no processamento.'
                                : paymentExpired
                                    ? 'O pedido foi encerrado porque o PIX expirou sem pagamento.'
                                    : pixLifecycle.isInGracePeriod
                                        ? 'O QR Code expirou, mas você ainda pode gerar um novo PIX antes do cancelamento automático.'
                                        : 'Assim que o PIX for compensado, o pedido segue para processamento.'
                            : 'Pagamento confirmado. Você receberá um e-mail com os detalhes da compra e os próximos passos do pedido.'}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default OrderSuccess;

import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Copy, CreditCard, Home, Loader2, QrCode, ShoppingBag } from 'lucide-react';
import { Button } from '@theadoro/ui';
import { useCheckout, Order } from '@/hooks/useCheckout';
import { toast } from 'sonner';

const OrderSuccess: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { getOrderById } = useCheckout();

    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);

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
    const pixCode = order?.paymentInfo?.pixCode || '';
    const pixExpiration = order?.paymentInfo?.pixExpiration || '';
    const isTestMode = Boolean(order?.paymentInfo?.isTestMode);

    const qrCodeUrl = useMemo(() => {
        if (order?.paymentInfo?.pixUrl) return order.paymentInfo.pixUrl;
        if (!pixCode) return '';

        return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(pixCode)}`;
    }, [order?.paymentInfo?.pixUrl, pixCode]);

    const handleCopyPix = async () => {
        if (!pixCode) return;

        try {
            await navigator.clipboard.writeText(pixCode);
            toast.success('Codigo PIX copiado!');
        } catch (error) {
            toast.error('Nao foi possivel copiar o codigo PIX.');
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
                        {isPix ? 'Pedido recebido!' : 'Pedido Realizado!'}
                    </h1>
                    <p className="text-gray-600">
                        {isPix
                            ? 'Seu pedido foi criado. Agora finalize o pagamento via PIX para liberar o processamento.'
                            : 'Seu pedido foi confirmado e ja esta sendo processado.'}
                    </p>
                    <div className="pt-2">
                        <span className="text-sm text-gray-500 uppercase tracking-wide">Numero do Pedido</span>
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
                                    Escaneie o QR Code ou copie o codigo abaixo para pagar.
                                </p>
                                {isTestMode && (
                                    <p className="mt-2 text-xs font-medium text-amber-700">
                                        Ambiente em modo teste do Pagar.me.
                                    </p>
                                )}
                            </div>
                        </div>

                        {qrCodeUrl && (
                            <div className="flex justify-center rounded-xl bg-white p-4">
                                <img
                                    src={qrCodeUrl}
                                    alt="QR Code PIX"
                                    className="h-56 w-56 max-w-full"
                                />
                            </div>
                        )}

                        {pixCode ? (
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
                                >
                                    <Copy className="mr-2 h-4 w-4" />
                                    Copiar codigo PIX
                                </Button>
                            </div>
                        ) : (
                            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                                O gateway nao retornou o codigo PIX para exibicao. Verifique o pedido no painel admin.
                            </div>
                        )}

                        {pixExpiration && (
                            <p className="text-xs text-gray-500">
                                Expira em: {new Date(pixExpiration).toLocaleString('pt-BR')}
                            </p>
                        )}
                    </div>
                )}

                <div className="pt-2 space-y-3">
                    <Button
                        className="w-full bg-blue-600 hover:bg-blue-700"
                        onClick={() => navigate('/buyer/orders')}
                    >
                        <ShoppingBag className="mr-2 h-4 w-4" />
                        Meus Pedidos
                    </Button>

                    <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => navigate('/')}
                    >
                        <Home className="mr-2 h-4 w-4" />
                        Voltar para Loja
                    </Button>
                </div>

                <div className="text-sm text-gray-500 pt-4 border-t border-gray-100">
                    <p className="flex items-center justify-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        {isPix
                            ? 'Assim que o PIX for compensado, o pedido segue para processamento.'
                            : 'Voce recebera um e-mail com os detalhes da compra.'}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default OrderSuccess;

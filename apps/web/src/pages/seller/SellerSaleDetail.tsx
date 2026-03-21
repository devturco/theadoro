import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
} from '@theadoro/ui';
import { toast } from 'sonner';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  CreditCard,
  Gift,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  Package,
  Phone,
  Printer,
  RefreshCcw,
  ShieldCheck,
  ShoppingBag,
  Truck,
  UserRound,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRole } from '@/hooks/useRole';
import { useOrders } from '@/hooks/useOrders';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import type { OrderStatus } from '@/types/order';

const APPROVED_PAYMENT_STATUSES = ['approved', 'paid', 'succeeded'];
const ACTIVE_ORDER_STATUSES: OrderStatus[] = ['pending', 'confirmed', 'processing', 'shipped'];

type SellerSale = {
  id: string;
  created_at: string;
  buyer_name: string;
  buyer_email: string;
  buyer_phone: string;
  status: OrderStatus;
  display_status: OrderStatus;
  tracking_number: string;
  shipping_method: string;
  shipping_cost: number;
  gift_wrap_price: number;
  discount_amount: number;
  subtotal_amount: number;
  total_amount: number;
  payment_method: string;
  payment_status: string;
  payment_id: string;
  gateway_error_message: string;
  notes: Record<string, any>;
  shipping_address: Record<string, any> | null;
  gift_options: Record<string, any> | null;
  payments: any[];
  items: Array<{
    id: string;
    product_id: string;
    product_name: string;
    product_image?: string;
    quantity: number;
    unit_price: number;
    gift_message?: string | null;
  }>;
};

const parseMaybeJson = <T,>(value: unknown, fallback: T): T => {
  if (!value) return fallback;
  if (typeof value !== 'string') return value as T;

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

const formatCurrency = (value: number | null | undefined) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(value || 0));

const formatDateTime = (value?: string | null) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatStatusLabel = (status?: string | null) => {
  const map: Record<string, string> = {
    pending: 'Pendente',
    confirmed: 'Confirmado',
    processing: 'Processando',
    shipped: 'Enviado',
    delivered: 'Entregue',
    cancelled: 'Cancelado',
    refunded: 'Reembolsado',
    approved: 'Aprovado',
    paid: 'Pago',
    succeeded: 'Aprovado',
    failed: 'Falhou',
    expired: 'Expirado',
  };

  return map[status || ''] || (status ? status.replace(/_/g, ' ') : 'Indefinido');
};

const formatPaymentMethod = (method?: string | null) => {
  const normalized = (method || '').toLowerCase();

  if (normalized === 'pix') return 'PIX';
  if (normalized === 'credit_card' || normalized === 'credit') return 'Cartao de credito';
  if (normalized === 'debit_card' || normalized === 'debit') return 'Cartao de debito';
  if (normalized === 'bank_transfer') return 'Transferencia bancaria';

  return method ? method.replace(/_/g, ' ') : 'Pagamento';
};

const deriveDisplayStatus = (orderStatus?: string | null, paymentStatus?: string | null): OrderStatus => {
  if (orderStatus === 'cancelled') return 'cancelled';
  if (orderStatus === 'refunded') return 'refunded';
  if (orderStatus && ['confirmed', 'processing', 'shipped', 'delivered'].includes(orderStatus)) {
    return orderStatus as OrderStatus;
  }
  if (paymentStatus && APPROVED_PAYMENT_STATUSES.includes(paymentStatus)) {
    return 'processing';
  }
  return (orderStatus as OrderStatus) || 'pending';
};

const getStatusTone = (status: string) => {
  if (status === 'cancelled' || status === 'failed' || status === 'expired') {
    return 'bg-red-50 text-red-700 border-red-200';
  }
  if (status === 'delivered' || status === 'approved' || status === 'paid' || status === 'succeeded') {
    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  }
  if (status === 'shipped' || status === 'processing' || status === 'confirmed') {
    return 'bg-blue-50 text-blue-700 border-blue-200';
  }
  return 'bg-amber-50 text-amber-700 border-amber-200';
};

const statusSteps: Array<{
  key: OrderStatus;
  label: string;
  icon: typeof Clock3;
}> = [
  { key: 'pending', label: 'Pendente', icon: Clock3 },
  { key: 'confirmed', label: 'Confirmado', icon: CheckCircle2 },
  { key: 'processing', label: 'Processando', icon: Package },
  { key: 'shipped', label: 'Enviado', icon: Truck },
  { key: 'delivered', label: 'Entregue', icon: CheckCircle2 },
];

const getTrackingStorageKey = (orderId: string) => `seller-sale-tracking:${orderId}`;

const readStoredTrackingNumber = (orderId: string) => {
  if (typeof window === 'undefined') return '';
  return window.sessionStorage.getItem(getTrackingStorageKey(orderId)) || '';
};

const writeStoredTrackingNumber = (orderId: string, trackingNumber: string) => {
  if (typeof window === 'undefined') return;

  if (trackingNumber) {
    window.sessionStorage.setItem(getTrackingStorageKey(orderId), trackingNumber);
    return;
  }

  window.sessionStorage.removeItem(getTrackingStorageKey(orderId));
};

export default function SellerSaleDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { hasRole } = useRole();
  const { updateOrderStatus } = useOrders({ scope: 'seller', fetchOnMount: false });

  const [sale, setSale] = useState<SellerSale | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusDraft, setStatusDraft] = useState<OrderStatus | ''>('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const lastSavedTrackingRef = useRef('');

  const isSeller = hasRole('seller') || hasRole('admin');

  const loadSaleDetails = useCallback(
    async (silent = false) => {
      if (!id || !user) return;

      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const { data, error } = await supabase
          .from('order_items')
          .select(`
            id,
            order_id,
            product_id,
            quantity,
            unit_price,
            gift_message,
            products (
              id,
              name,
              images
            ),
            orders (
              id,
              created_at,
              status,
              shipping_address,
              shipping_method,
              shipping_cost,
              gift_wrap_price,
              discount_amount,
              subtotal_amount,
              total_amount,
              payment_method,
              notes,
              profiles:buyer_id (
                full_name,
                email,
                phone
              ),
              payments (
                id,
                provider,
                provider_transaction_id,
                status,
                metadata,
                created_at
              )
            )
          `)
          .eq('seller_id', user.id)
          .eq('order_id', id);

        if (error) throw error;

        if (!data || data.length === 0) {
          setSale(null);
          toast.error('Venda nao encontrada');
          return;
        }

        const order = data[0].orders as any;
        const notes = parseMaybeJson<Record<string, any>>(order?.notes, {});
        const shippingAddress = parseMaybeJson<Record<string, any> | null>(order?.shipping_address, null);
        const payments = [...(order?.payments || [])].sort(
          (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        const latestPayment = payments[0];
        const latestPaymentMetadata = parseMaybeJson<Record<string, any>>(latestPayment?.metadata, {});
        const paymentStatus = latestPayment?.status || notes?.paymentInfo?.status || 'pending';
        const displayStatus = deriveDisplayStatus(order?.status, paymentStatus);
        const resolvedTrackingNumber =
          notes?.tracking_number ||
          notes?.trackingNumber ||
          notes?.fulfillment?.tracking_number ||
          notes?.fulfillment?.trackingNumber ||
          lastSavedTrackingRef.current ||
          readStoredTrackingNumber(order.id) ||
          '';
        const gatewayErrorMessage =
          latestPaymentMetadata?.gatewayErrorMessage ||
          latestPaymentMetadata?.gatewayResponse?.charges?.[0]?.last_transaction?.gateway_response?.errors?.[0]?.message ||
          notes?.paymentInfo?.gatewayErrorMessage ||
          '';

        const nextSale: SellerSale = {
          id: order.id,
          created_at: order.created_at,
          buyer_name: order?.profiles?.full_name || notes?.customer?.firstName || 'Cliente',
          buyer_email: order?.profiles?.email || '',
          buyer_phone:
            order?.profiles?.phone ||
            notes?.customer?.phone ||
            shippingAddress?.recipient_phone ||
            '',
          status: (order?.status || 'pending') as OrderStatus,
          display_status: displayStatus,
          tracking_number: resolvedTrackingNumber,
          shipping_method: order?.shipping_method || 'Entrega padrao',
          shipping_cost: Number(order?.shipping_cost || notes?.shipping_cost || notes?.shippingCost || 0),
          gift_wrap_price: Number(order?.gift_wrap_price || notes?.gift_wrap_price || notes?.giftWrapPrice || 0),
          discount_amount: Number(order?.discount_amount || notes?.discount_amount || notes?.discountAmount || 0),
          subtotal_amount:
            Number(order?.subtotal_amount || notes?.subtotal || notes?.subtotal_amount) ||
            data.reduce((sum: number, item: any) => sum + Number(item.unit_price || 0) * Number(item.quantity || 0), 0),
          total_amount: Number(order?.total_amount || 0),
          payment_method: order?.payment_method || '',
          payment_status: paymentStatus,
          payment_id:
            latestPaymentMetadata?.providerTransactionId ||
            latestPayment?.provider_transaction_id ||
            notes?.paymentInfo?.id ||
            '',
          gateway_error_message: gatewayErrorMessage,
          notes,
          shipping_address: shippingAddress,
          gift_options: notes?.giftOptions || null,
          payments,
          items: data.map((item: any) => ({
            id: item.id,
            product_id: item.product_id,
            product_name: item.products?.name || 'Produto',
            product_image: item.products?.images?.[0],
            quantity: Number(item.quantity || 0),
            unit_price: Number(item.unit_price || 0),
            gift_message: item.gift_message,
          })),
        };

        setSale(nextSale);
        setStatusDraft((prev) => prev || nextSale.display_status);
        setTrackingNumber((prev) => resolvedTrackingNumber || prev);

        if (resolvedTrackingNumber) {
          lastSavedTrackingRef.current = resolvedTrackingNumber;
          writeStoredTrackingNumber(order.id, resolvedTrackingNumber);
        }
      } catch (err: any) {
        console.error('Error loading seller sale details:', err);
        toast.error('Nao foi possivel carregar a venda');
        setSale(null);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [id, user]
  );

  useEffect(() => {
    if (user && id && isSeller) {
      void loadSaleDetails();
    }
  }, [id, isSeller, loadSaleDetails, user]);

  useEffect(() => {
    if (!sale || !ACTIVE_ORDER_STATUSES.includes(sale.display_status) || !user) return;

    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        void loadSaleDetails(true);
      }
    }, 12000);

    return () => window.clearInterval(interval);
  }, [loadSaleDetails, sale, user]);

  useEffect(() => {
    if (!sale || !user) return;

    const handleFocusRefresh = () => {
      if (document.visibilityState === 'visible') {
        void loadSaleDetails(true);
      }
    };

    window.addEventListener('focus', handleFocusRefresh);
    document.addEventListener('visibilitychange', handleFocusRefresh);

    return () => {
      window.removeEventListener('focus', handleFocusRefresh);
      document.removeEventListener('visibilitychange', handleFocusRefresh);
    };
  }, [loadSaleDetails, sale, user]);

  const currentStepIndex = useMemo(() => {
    const index = statusSteps.findIndex((step) => step.key === sale?.display_status);
    return index >= 0 ? index : 0;
  }, [sale?.display_status]);

  const paymentSummaryLabel = useMemo(() => {
    if (!sale) return 'Pagamento';
    if (sale.payment_status === 'failed') return 'Pagamento recusado';
    if (sale.payment_status === 'expired') return 'PIX expirado';
    if (APPROVED_PAYMENT_STATUSES.includes(sale.payment_status)) return 'Pagamento aprovado';
    return 'Pagamento pendente';
  }, [sale]);

  const timeline = useMemo(() => {
    if (!sale) return [];

    const entries = [
      {
        key: 'created',
        title: 'Pedido criado',
        description: 'A compra entrou no painel do vendedor.',
        tone: 'bg-slate-700',
      },
      {
        key: 'payment',
        title: paymentSummaryLabel,
        description:
          sale.payment_status === 'failed'
            ? 'O gateway recusou a cobranca e a venda precisa de nova acao do comprador.'
            : sale.payment_status === 'expired'
              ? 'O prazo do PIX terminou e o pedido nao deve seguir para separacao.'
              : APPROVED_PAYMENT_STATUSES.includes(sale.payment_status)
                ? 'Pagamento confirmado. A venda ja pode seguir para preparo e despacho.'
                : 'Pagamento ainda em analise ou aguardando confirmacao do gateway.',
        tone:
          sale.payment_status === 'failed' || sale.payment_status === 'expired'
            ? 'bg-red-500'
            : APPROVED_PAYMENT_STATUSES.includes(sale.payment_status)
              ? 'bg-emerald-500'
              : 'bg-amber-500',
      },
      {
        key: 'shipping',
        title:
          sale.display_status === 'shipped' || sale.display_status === 'delivered'
            ? 'Pedido despachado'
            : 'Aguardando despacho',
        description: sale.tracking_number
          ? `Codigo de rastreio ${sale.tracking_number}`
          : 'Assim que o envio for confirmado, o comprador recebe o rastreio.',
        tone: sale.tracking_number ? 'bg-blue-500' : 'bg-slate-300',
      },
    ];

    if (sale.display_status === 'delivered') {
      entries.push({
        key: 'delivered',
        title: 'Entrega concluida',
        description: 'O pedido chegou ao comprador e a jornada foi finalizada.',
        tone: 'bg-emerald-600',
      });
    }

    return entries;
  }, [paymentSummaryLabel, sale]);

  const handleStatusSave = async () => {
    if (!sale || !statusDraft) return;
    const nextTrackingNumber = trackingNumber.trim();

    if (statusDraft === 'shipped' && !nextTrackingNumber) {
      toast.error('Informe o codigo de rastreio antes de marcar como enviado');
      return;
    }

    try {
      setSaving(true);
      if (nextTrackingNumber) {
        lastSavedTrackingRef.current = nextTrackingNumber;
        writeStoredTrackingNumber(sale.id, nextTrackingNumber);
      }

      setSale((prev) =>
        prev
          ? {
              ...prev,
              status: statusDraft,
              display_status: statusDraft === 'pending' ? prev.display_status : statusDraft,
              tracking_number: nextTrackingNumber || prev.tracking_number,
              notes: {
                ...prev.notes,
                tracking_number: nextTrackingNumber || prev.notes?.tracking_number,
                fulfillment: {
                  ...(prev.notes?.fulfillment || {}),
                  tracking_number: nextTrackingNumber || prev.notes?.fulfillment?.tracking_number,
                },
              },
            }
          : prev
      );

      await updateOrderStatus(sale.id, statusDraft, nextTrackingNumber || undefined);
      toast.success('Controle da venda atualizado');
      await loadSaleDetails(true);
    } catch (err) {
      console.error('Error updating seller order status:', err);
    } finally {
      setSaving(false);
    }
  };

  if (!isSeller) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" asChild className="w-fit">
          <Link to="/seller/sales">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para vendas
          </Link>
        </Button>
        <Card>
          <CardContent className="flex min-h-[220px] flex-col items-center justify-center gap-4 text-center">
            <AlertCircle className="h-10 w-10 text-red-500" />
            <div>
              <p className="text-lg font-semibold">Acesso indisponivel</p>
              <p className="text-sm text-muted-foreground">
                Esta pagina e exclusiva para vendedores.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading && !sale) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" asChild className="w-fit">
          <Link to="/seller/sales">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para vendas
          </Link>
        </Button>
        <Card>
          <CardContent className="flex min-h-[320px] items-center justify-center">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              Carregando detalhes da venda...
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!sale) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" asChild className="w-fit">
          <Link to="/seller/sales">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para vendas
          </Link>
        </Button>
        <Card>
          <CardContent className="flex min-h-[320px] flex-col items-center justify-center gap-4 text-center">
            <AlertCircle className="h-10 w-10 text-amber-500" />
            <div className="space-y-1">
              <p className="text-lg font-semibold">Nao foi possivel abrir esta venda</p>
              <p className="text-sm text-muted-foreground">
                Se a conexao falhou, tente recarregar os dados agora.
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => navigate('/seller/sales')}>
                Voltar para a lista
              </Button>
              <Button onClick={() => void loadSaleDetails()}>
                <RefreshCcw className="mr-2 h-4 w-4" />
                Tentar novamente
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const shippingAddress = sale.shipping_address;
  const giftOptions = sale.gift_options;
  const whatsappPhone = sale.buyer_phone.replace(/\D/g, '');

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <Button variant="ghost" asChild className="w-fit px-0">
            <Link to="/seller/sales">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para vendas
            </Link>
          </Button>

          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">
                Venda #{sale.id.slice(0, 8)}
              </h1>
              <Badge className={cn('border', getStatusTone(sale.display_status))}>
                {formatStatusLabel(sale.display_status)}
              </Badge>
              <Badge className={cn('border', getStatusTone(sale.payment_status))}>
                {paymentSummaryLabel}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Pedido realizado em {formatDateTime(sale.created_at)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={() => void loadSaleDetails(true)} disabled={refreshing}>
            {refreshing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCcw className="mr-2 h-4 w-4" />
            )}
            Atualizar
          </Button>
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" />
            Imprimir comprovante
          </Button>
        </div>
      </div>

      <Card className="border-none bg-gradient-to-r from-rose-50 via-white to-amber-50 shadow-sm">
        <CardContent className="grid gap-4 p-5 md:grid-cols-4">
          <div className="rounded-2xl border bg-white/80 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Total</p>
            <p className="mt-2 text-2xl font-bold">{formatCurrency(sale.total_amount)}</p>
          </div>
          <div className="rounded-2xl border bg-white/80 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Pagamento</p>
            <p className="mt-2 font-semibold">{formatPaymentMethod(sale.payment_method)}</p>
            <p className="mt-1 text-sm text-muted-foreground">{paymentSummaryLabel}</p>
          </div>
          <div className="rounded-2xl border bg-white/80 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Despacho</p>
            <p className="mt-2 font-semibold">
              {sale.tracking_number ? 'Rastreio registrado' : 'Aguardando envio'}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {sale.shipping_method || 'Entrega padrao'}
            </p>
          </div>
          <div className="rounded-2xl border bg-white/80 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Cliente</p>
            <p className="mt-2 font-semibold">{sale.buyer_name}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {sale.items.length} {sale.items.length === 1 ? 'item' : 'itens'} nesta venda
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="overflow-x-auto px-4 py-5">
          <div className="flex min-w-[720px] items-center justify-between gap-4">
            {statusSteps.map((step, index) => {
              const Icon = step.icon;
              const isCompleted = index <= currentStepIndex;
              const isCurrent = index === currentStepIndex;

              return (
                <div key={step.key} className="flex flex-1 items-center gap-4">
                  <div className="flex flex-col items-center text-center">
                    <div
                      className={cn(
                        'flex h-12 w-12 items-center justify-center rounded-full border transition-colors',
                        isCompleted
                          ? 'border-rose-700 bg-rose-700 text-white'
                          : 'border-slate-200 bg-white text-slate-400',
                        isCurrent && 'ring-4 ring-rose-100'
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <span
                      className={cn(
                        'mt-3 text-sm font-medium',
                        isCompleted ? 'text-rose-700' : 'text-slate-400'
                      )}
                    >
                      {step.label}
                    </span>
                  </div>
                  {index < statusSteps.length - 1 && (
                    <div className={cn('h-px flex-1', index < currentStepIndex ? 'bg-rose-700' : 'bg-slate-200')} />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.45fr_0.95fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5" />
                Itens da venda
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {sale.items.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-4 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex gap-4">
                    <div className="h-20 w-20 overflow-hidden rounded-2xl bg-slate-100">
                      {item.product_image ? (
                        <img
                          src={item.product_image}
                          alt={item.product_name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-slate-400">
                          <Package className="h-6 w-6" />
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <div>
                        <p className="font-semibold">{item.product_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.quantity} x {formatCurrency(item.unit_price)}
                        </p>
                      </div>
                      {item.gift_message && (
                        <div className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800">
                          Mensagem do presente: "{item.gift_message}"
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Subtotal do item</p>
                    <p className="mt-1 text-lg font-semibold">
                      {formatCurrency(item.quantity * item.unit_price)}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Linha do tempo operacional
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {timeline.map((entry) => (
                <div key={entry.key} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <span className={cn('mt-1 h-3 w-3 rounded-full', entry.tone)} />
                    <span className="mt-2 h-full w-px bg-slate-200 last:hidden" />
                  </div>
                  <div className="pb-4">
                    <p className="font-medium">{entry.title}</p>
                    <p className="text-sm text-muted-foreground">{entry.description}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserRound className="h-5 w-5" />
                Comprador
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Nome</p>
                  <p className="mt-2 font-semibold">{sale.buyer_name}</p>
                </div>
                <div className="rounded-2xl border p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Pagamento</p>
                  <p className="mt-2 font-semibold">{formatPaymentMethod(sale.payment_method)}</p>
                </div>
                <div className="rounded-2xl border p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Email</p>
                  <p className="mt-2 break-all font-semibold">{sale.buyer_email || 'Nao informado'}</p>
                </div>
                <div className="rounded-2xl border p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Telefone</p>
                  <p className="mt-2 font-semibold">{sale.buyer_phone || 'Nao informado'}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                {sale.buyer_email && (
                  <Button variant="outline" asChild>
                    <a href={`mailto:${sale.buyer_email}`}>
                      <Mail className="mr-2 h-4 w-4" />
                      Enviar e-mail
                    </a>
                  </Button>
                )}
                {whatsappPhone && (
                  <Button variant="outline" asChild>
                    <a href={`https://wa.me/55${whatsappPhone}`} target="_blank" rel="noreferrer">
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Falar no WhatsApp
                    </a>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {giftOptions?.is_gift && (
            <Card className="border-purple-100 bg-purple-50/60">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-900">
                  <Gift className="h-5 w-5" />
                  Contexto do presente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-purple-950">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-purple-700">Remetente</p>
                    <p className="mt-2 font-medium">{giftOptions.sender_name || 'Nao informado'}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-purple-700">Destinatario</p>
                    <p className="mt-2 font-medium">{giftOptions.recipient_name || 'Nao informado'}</p>
                  </div>
                </div>
                {giftOptions.message && (
                  <div className="rounded-2xl border border-purple-200 bg-white/80 p-4 italic">
                    "{giftOptions.message}"
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5" />
                Controle da venda
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="sale-status">Etapa atual</Label>
                <Select value={statusDraft || sale.display_status} onValueChange={(value) => setStatusDraft(value as OrderStatus)}>
                  <SelectTrigger id="sale-status">
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="confirmed">Confirmado</SelectItem>
                    <SelectItem value="processing">Processando</SelectItem>
                    <SelectItem value="shipped">Enviado</SelectItem>
                    <SelectItem value="delivered">Entregue</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tracking-number">Codigo de rastreio</Label>
                <Input
                  id="tracking-number"
                  placeholder="Ex.: BR123456789"
                  value={trackingNumber}
                  onChange={(event) => setTrackingNumber(event.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Obrigatorio ao marcar a venda como enviada.
                </p>
              </div>

              <Button className="w-full" onClick={handleStatusSave} disabled={saving}>
                {saving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                )}
                Salvar atualizacao
              </Button>

              <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                <p className="font-medium text-slate-900">Leitura automatica do pagamento</p>
                <p className="mt-1">
                  Quando o gateway aprova o pagamento, esta pagina trata a venda como pronta para processamento,
                  mesmo que um pedido antigo ainda tenha vindo com status pendente.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Financeiro
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Produtos</span>
                <span>{formatCurrency(sale.subtotal_amount)}</span>
              </div>
              {sale.gift_wrap_price > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Embalagem</span>
                  <span>{formatCurrency(sale.gift_wrap_price)}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Frete</span>
                <span>{formatCurrency(sale.shipping_cost)}</span>
              </div>
              {sale.discount_amount > 0 && (
                <div className="flex items-center justify-between text-sm text-emerald-700">
                  <span>Desconto</span>
                  <span>-{formatCurrency(sale.discount_amount)}</span>
                </div>
              )}
              <Separator />
              <div className="flex items-center justify-between text-base font-semibold">
                <span>Total</span>
                <span>{formatCurrency(sale.total_amount)}</span>
              </div>

              <div className="rounded-2xl border p-4 text-sm">
                <p className="font-medium">{paymentSummaryLabel}</p>
                <p className="mt-1 text-muted-foreground">
                  Metodo: {formatPaymentMethod(sale.payment_method)}
                </p>
                {sale.payment_id && (
                  <p className="mt-1 break-all text-muted-foreground">
                    Transaction ID: {sale.payment_id}
                  </p>
                )}
                {sale.gateway_error_message && (
                  <p className="mt-2 rounded-xl bg-red-50 px-3 py-2 text-red-700">
                    Falha do gateway: {sale.gateway_error_message}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Entrega
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl border p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Metodo de envio</p>
                <p className="mt-2 font-semibold">{sale.shipping_method || 'Entrega padrao'}</p>
              </div>

              <div className="rounded-2xl border p-4 text-sm">
                <p className="font-medium">
                  {shippingAddress?.recipient_name || sale.buyer_name || 'Destinatario'}
                </p>
                <div className="mt-2 space-y-1 text-muted-foreground">
                  <p>
                    {shippingAddress?.street || shippingAddress?.address || 'Endereco nao informado'}
                    {shippingAddress?.number ? `, ${shippingAddress.number}` : ''}
                  </p>
                  {shippingAddress?.complement && <p>{shippingAddress.complement}</p>}
                  <p>
                    {shippingAddress?.neighborhood ? `${shippingAddress.neighborhood} - ` : ''}
                    {shippingAddress?.city || 'Cidade'}
                    {shippingAddress?.state ? ` / ${shippingAddress.state}` : ''}
                  </p>
                  {(shippingAddress?.zip_code || shippingAddress?.zipCode) && (
                    <p>CEP: {shippingAddress?.zip_code || shippingAddress?.zipCode}</p>
                  )}
                  {(shippingAddress?.recipient_phone || sale.buyer_phone) && (
                    <p className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      {shippingAddress?.recipient_phone || sale.buyer_phone}
                    </p>
                  )}
                </div>
              </div>

              <div className="rounded-2xl bg-blue-50 p-4 text-sm text-blue-800">
                <p className="font-medium">
                  {sale.tracking_number ? 'Rastreio ativo' : 'Rastreio pendente'}
                </p>
                <p className="mt-1">
                  {sale.tracking_number
                    ? `Codigo atual: ${sale.tracking_number}`
                    : 'Assim que o envio for despachado, registre o codigo para atualizar o comprador em tempo real.'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

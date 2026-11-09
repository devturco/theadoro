import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@theadoro/ui';
import { Button } from '@theadoro/ui';
import { Badge } from '@theadoro/ui';
import { Input } from '@theadoro/ui';
import { Label } from '@theadoro/ui';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@theadoro/ui';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@theadoro/ui';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CreditCard, CheckCircle, AlertCircle, Clock, FileText, ArrowUpRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
    PagarmeTokenizecardForm,
    type PagarmeTokenizecardFormHandle,
} from '@/components/payments/PagarmeTokenizecardForm';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Plan {
    id: string;
    name: string;
    price: number;
    features: any;
}

interface Subscription {
    id: string;
    status: string;
    current_period_end: string;
    plan: Plan;
}

interface Invoice {
    id: string;
    amount: number;
    status: string;
    due_date: string;
    paid_at: string | null;
    invoice_url: string | null;
    payment_method?: string | null;
}

export default function SellerSubscription() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [availablePlans, setAvailablePlans] = useState<Plan[]>([]);
    const [processingPayment, setProcessingPayment] = useState<string | null>(null);
    const [subscribing, setSubscribing] = useState<string | null>(null);
    const [canceling, setCanceling] = useState(false);
    const [showPlanSelection, setShowPlanSelection] = useState(false);
    const [payInvoice, setPayInvoice] = useState<Invoice | null>(null);
    const [payMethod, setPayMethod] = useState<'credit_card' | 'pix'>('credit_card');
    const [cardData, setCardData] = useState({ number: '', name: '', expiry: '', cvv: '' });
    const [pixData, setPixData] = useState<{ code?: string; url?: string } | null>(null);
    const pagarmeTokenizecardRef = useRef<PagarmeTokenizecardFormHandle | null>(null);

    useEffect(() => {
        if (user) {
            loadData();
        }
    }, [user]);

    const loadData = async () => {
        try {
            setLoading(true);

            // 1. Get current subscription
            const { data: subData, error: subError } = await (supabase as any)
                .from('seller_subscriptions')
                .select(`
                    id,
                    status,
                    current_period_end,
                    plan:plan_id (
                        id,
                        name,
                        price,
                        features
                    )
                `)
                .eq('seller_id', user?.id)
                .maybeSingle(); // Use maybeSingle to avoid 406 if none or multiple (should be one active)

            if (subError && subError.code !== 'PGRST116') {
                console.error('Error fetching subscription:', subError);
            }

            if (subData) {
                // Parse features if string
                const planData = subData.plan;
                if (planData && typeof planData.features === 'string') {
                    planData.features = JSON.parse(planData.features);
                }
                setSubscription(subData);
            }

            // 2. Get invoices
            const { data: invData, error: invError } = await (supabase as any)
                .from('seller_invoices')
                .select('*')
                .eq('seller_id', user?.id)
                .order('due_date', { ascending: false });

            if (invError) {
                console.error('Error fetching invoices:', invError);
            } else {
                setInvoices(invData || []);
            }

            // 3. Get available plans
            const { data: plansData, error: plansError } = await (supabase as any)
                .from('subscription_plans')
                .select('*')
                .eq('is_active', true)
                .order('price', { ascending: true });

            if (plansError) {
                console.error('Error fetching plans:', plansError);
            } else {
                // Parse features if string
                const formattedPlans = (plansData || []).map((p: any) => ({
                    ...p,
                    features: typeof p.features === 'string' ? JSON.parse(p.features) : p.features
                }));
                setAvailablePlans(formattedPlans);
            }

        } catch (error) {
            console.error('Error loading subscription data:', error);
            toast.error('Erro ao carregar dados da assinatura.');
        } finally {
            setLoading(false);
        }
    };

    const callInvoicePayment = async (body: Record<string, unknown>) => {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.access_token) {
            throw new Error('Sua sessão expirou. Entre novamente.');
        }

        const response = await fetch(`${supabaseUrl}/functions/v1/seller-invoice-payment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                apikey: publishableKey,
                Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify(body),
        });

        const payload = await response.json().catch(() => null);

        if (!response.ok || payload?.error) {
            throw new Error(payload?.message || payload?.error || 'Falha ao processar o pagamento da fatura.');
        }

        return payload;
    };

    const openInvoicePayment = (invoice: Invoice) => {
        setPixData(null);
        setCardData({ number: '', name: '', expiry: '', cvv: '' });
        setPayMethod('credit_card');
        setPayInvoice(invoice);
    };

    const handlePayInvoice = async () => {
        if (!payInvoice) return;

        try {
            setProcessingPayment(payInvoice.id);

            if (payMethod === 'credit_card') {
                const cardToken = await pagarmeTokenizecardRef.current?.tokenize();

                if (!cardToken) {
                    throw new Error('Não foi possível tokenizar o cartão.');
                }

                const result = await callInvoicePayment({
                    action: 'pay_card',
                    invoiceId: payInvoice.id,
                    cardToken,
                    installments: 1,
                });

                if (result.status === 'paid') {
                    toast.success('Fatura paga com sucesso!');
                    setPayInvoice(null);
                    loadData();
                } else {
                    toast.info(result.message || 'Pagamento em análise pelo gateway.');
                }
            } else {
                const result = await callInvoicePayment({
                    action: 'create_pix',
                    invoiceId: payInvoice.id,
                });

                setPixData({ code: result.pix_code, url: result.pix_url });
                toast.success('PIX gerado! A confirmação chega automaticamente após o pagamento.');
                loadData();
            }
        } catch (error: any) {
            toast.error(error.message || 'Erro ao pagar a fatura.');
        } finally {
            setProcessingPayment(null);
        }
    };

    const handleSelectPlan = async (planId: string) => {
        try {
            setSubscribing(planId);

            await callInvoicePayment({ action: 'change_plan', planId });

            toast.success('Plano atualizado! A nova fatura foi gerada.');
            setShowPlanSelection(false);
            loadData();
        } catch (error: any) {
            console.error('Error subscribing:', error);
            toast.error('Erro ao processar plano: ' + error.message);
        } finally {
            setSubscribing(null);
        }
    };

    const handleCancelSubscription = async () => {
        if (!subscription) return;

        const confirmDialog = window.confirm("Tem certeza que deseja cancelar sua assinatura? Você manterá seus benefícios até o final do período atual.");
        if (!confirmDialog) return;

        try {
            setCanceling(true);

            await callInvoicePayment({ action: 'cancel_subscription' });

            toast.success('Sua assinatura não será renovada. Você continuará como vendedor até o vencimento.');
            loadData();
        } catch (error: any) {
            toast.error('Erro ao cancelar assinatura: ' + error.message);
        } finally {
            setCanceling(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-800 border-green-200';
            case 'past_due': return 'bg-red-100 text-red-800 border-red-200';
            case 'canceled': return 'bg-gray-100 text-gray-800 border-gray-200';
            case 'trialing': return 'bg-blue-100 text-blue-800 border-blue-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getInvoiceStatusColor = (status: string) => {
        switch (status) {
            case 'paid': return 'text-green-600 bg-green-50';
            case 'pending': return 'text-amber-600 bg-amber-50';
            case 'overdue': return 'text-red-600 bg-red-50';
            case 'cancelled': return 'text-gray-500 bg-gray-50';
            default: return 'text-gray-500';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-wine"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Minha Assinatura</h1>
                <p className="text-muted-foreground">Gerencie seu plano e histórico de pagamentos.</p>
            </div>

            {/* Current Plan Card */}
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="text-xl flex items-center gap-2">
                                {showPlanSelection ? 'Selecione um Novo Plano' : 'Plano Atual'}
                                {subscription && !showPlanSelection && (
                                    <Badge variant="outline" className={getStatusColor(subscription.status)}>
                                        {subscription.status === 'active' ? 'Ativo' :
                                            subscription.status === 'past_due' ? 'Pagamento Atrasado' :
                                                subscription.status === 'canceled' ? 'Cancelado (Não Renova)' : subscription.status}
                                    </Badge>
                                )}
                            </CardTitle>
                            <CardDescription>
                                {showPlanSelection ? 'Escolha o plano que melhor se adapta às suas necessidades.' : 'Detalhes do seu plano contratado.'}
                            </CardDescription>
                        </div>
                        {subscription?.plan && !showPlanSelection && (
                            <div className="text-right">
                                <p className="text-2xl font-bold">R$ {Number(subscription.plan.price).toFixed(2)}</p>
                                <p className="text-sm text-muted-foreground">/mês</p>
                            </div>
                        )}
                        {showPlanSelection && (
                            <Button variant="ghost" size="sm" onClick={() => setShowPlanSelection(false)}>
                                Voltar para Assinatura
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    {!subscription || showPlanSelection ? (
                        <div className="space-y-6">
                            {!subscription ? (
                                <div className="text-center py-6 bg-amber-50 rounded-lg border border-amber-100 flex flex-col items-center">
                                    <AlertCircle className="h-8 w-8 text-amber-500 mb-2" />
                                    <p className="text-amber-800 font-medium">Você ainda não possui uma assinatura configurada.</p>
                                    <p className="text-amber-600 text-sm max-w-md mt-1">
                                        Escolha um dos planos abaixo para começar a vender. Suas funcionalidades serão liberadas após a confirmação do pagamento.
                                    </p>
                                </div>
                            ) : null}

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                                {availablePlans.map((plan) => {
                                    const isCurrentPlan = subscription?.plan?.id === plan.id;
                                    return (
                                        <Card key={plan.id} className={cn(
                                            "flex flex-col relative overflow-hidden transition-all hover:shadow-md",
                                            plan.name === 'TheAdoro Pro' ? "border-wine ring-1 ring-wine/20" : "",
                                            isCurrentPlan ? "border-green-500 bg-green-50/10" : ""
                                        )}>
                                            {plan.name === 'TheAdoro Pro' && (
                                                <div className="absolute top-0 right-0">
                                                    <div className="bg-wine text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider">
                                                        Melhor Escolha
                                                    </div>
                                                </div>
                                            )}
                                            {isCurrentPlan && (
                                                <div className="absolute top-0 left-0">
                                                    <div className="bg-green-500 text-white text-[10px] font-bold px-3 py-1 rounded-br-lg uppercase tracking-wider">
                                                        Seu Plano
                                                    </div>
                                                </div>
                                            )}
                                            <CardHeader className="pb-4 pt-10">
                                                <CardTitle className="text-lg">{plan.name}</CardTitle>
                                                <div className="mt-2">
                                                    <span className="text-3xl font-bold">R$ {Number(plan.price).toFixed(2)}</span>
                                                    <span className="text-muted-foreground text-sm ml-1">/mês</span>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="flex-grow pb-6">
                                                <ul className="space-y-2">
                                                    {Array.isArray(plan.features) && plan.features.map((feature, idx) => (
                                                        <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                                                            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                                                            <span>{feature}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </CardContent>
                                            <CardFooter className="pt-0 pb-6 pr-6 pl-6">
                                                <Button
                                                    className={cn("w-full transition-all",
                                                        plan.name === 'TheAdoro Pro' && !isCurrentPlan ? "bg-wine hover:bg-wine-dark" : "",
                                                        isCurrentPlan ? "bg-green-600 hover:bg-green-600 text-white cursor-default" : ""
                                                    )}
                                                    variant={isCurrentPlan ? "default" : (plan.name === 'TheAdoro Pro' ? "default" : "outline")}
                                                    onClick={() => !isCurrentPlan && handleSelectPlan(plan.id)}
                                                    disabled={subscribing !== null || isCurrentPlan}
                                                >
                                                    {isCurrentPlan ? (
                                                        <span className="flex items-center gap-2">
                                                            <CheckCircle className="h-4 w-4" /> Plano Atual
                                                        </span>
                                                    ) : (
                                                        subscribing === plan.id ? 'Processando...' : 'Selecionar Plano'
                                                    )}
                                                </Button>
                                            </CardFooter>
                                        </Card>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <h3 className="font-semibold mb-2 text-sm text-gray-500 uppercase">Informações do Plano</h3>
                                <p className="text-lg font-medium">{subscription.plan.name}</p>
                                <div className="mt-4 space-y-2">
                                    <p className="text-sm text-gray-600 flex items-center gap-2">
                                        <Clock className="h-4 w-4" />
                                        Próxima renovação: <span className="font-medium text-gray-900">
                                            {format(new Date(subscription.current_period_end), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                                        </span>
                                    </p>
                                    <p className="text-sm text-gray-600 flex items-center gap-2">
                                        <CreditCard className="h-4 w-4" />
                                        Forma de pagamento: <span className="font-medium text-gray-900">
                                            {invoices.some((invoice) => invoice.status === 'paid' && invoice.payment_method === 'pix')
                                                ? 'PIX'
                                                : invoices.some((invoice) => invoice.status === 'paid')
                                                    ? 'Cartão de Crédito'
                                                    : 'Ainda não informada'}
                                        </span>
                                    </p>
                                </div>
                            </div>

                            {/* Actions / Upgrade */}
                            <div className="flex flex-col justify-center space-y-3">
                                <Button
                                    variant="outline"
                                    className="w-full justify-between"
                                    onClick={() => setShowPlanSelection(true)}
                                >
                                    Alterar Plano <ArrowUpRight className="h-4 w-4" />
                                </Button>
                                {subscription.status !== 'canceled' && (
                                    <Button
                                        variant="outline"
                                        className="w-full justify-between text-red-600 hover:text-red-700 hover:bg-red-50"
                                        onClick={handleCancelSubscription}
                                        disabled={canceling}
                                    >
                                        {canceling ? 'Processando...' : 'Cancelar Assinatura'}
                                    </Button>
                                )}
                                {subscription.status === 'canceled' && (
                                    <div className="p-4 bg-gray-50 rounded-lg border text-sm text-gray-500">
                                        Assinatura cancelada. Você poderá usar o sistema até {format(new Date(subscription.current_period_end), "dd/MM/yyyy")}.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Invoices History */}
            <Card>
                <CardHeader>
                    <CardTitle>Histórico de Faturas</CardTitle>
                    <CardDescription>Visualize e baixe suas faturas mensais.</CardDescription>
                </CardHeader>
                <CardContent>
                    {invoices.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            Nenhuma fatura encontrada.
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Data de Vencimento</TableHead>
                                    <TableHead>Valor</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Data Pagamento</TableHead>
                                    <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {invoices.map((invoice) => (
                                    <TableRow key={invoice.id}>
                                        <TableCell className="font-medium">
                                            {format(new Date(invoice.due_date), "dd/MM/yyyy")}
                                        </TableCell>
                                        <TableCell>R$ {Number(invoice.amount).toFixed(2)}</TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className={getInvoiceStatusColor(invoice.status)}>
                                                {invoice.status === 'paid' ? 'Pago' :
                                                    invoice.status === 'pending' ? 'Pendente' :
                                                        invoice.status === 'overdue' ? 'Atrasado' : invoice.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {invoice.paid_at ? format(new Date(invoice.paid_at), "dd/MM/yyyy HH:mm") : '-'}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {invoice.status === 'pending' || invoice.status === 'overdue' ? (
                                                <Button
                                                    size="sm"
                                                    className="bg-green-600 hover:bg-green-700 h-8"
                                                    onClick={() => openInvoicePayment(invoice)}
                                                    disabled={processingPayment === invoice.id}
                                                >
                                                    {processingPayment === invoice.id ? 'Processando...' : 'Pagar Agora'}
                                                </Button>
                                            ) : (
                                                <Button variant="ghost" size="sm" className="h-8">
                                                    <FileText className="h-4 w-4 mr-2" />
                                                    Recibo
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <Dialog open={!!payInvoice} onOpenChange={(open) => { if (!open) setPayInvoice(null); }}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Pagar fatura</DialogTitle>
                        <DialogDescription>
                            {payInvoice
                                ? `Fatura de R$ ${Number(payInvoice.amount).toFixed(2)} com vencimento em ${format(new Date(payInvoice.due_date), 'dd/MM/yyyy')}.`
                                : ''}
                        </DialogDescription>
                    </DialogHeader>

                    <PagarmeTokenizecardForm
                        ref={pagarmeTokenizecardRef}
                        enabled={payMethod === 'credit_card'}
                        holderName={cardData.name}
                        cardNumber={cardData.number}
                        cardExpiry={cardData.expiry}
                        cardCvv={cardData.cvv}
                    />

                    <div className="flex gap-2">
                        <Button
                            variant={payMethod === 'credit_card' ? 'default' : 'outline'}
                            className={payMethod === 'credit_card' ? 'bg-wine' : ''}
                            onClick={() => setPayMethod('credit_card')}
                            disabled={!!pixData}
                        >
                            Cartão
                        </Button>
                        <Button
                            variant={payMethod === 'pix' ? 'default' : 'outline'}
                            className={payMethod === 'pix' ? 'bg-wine' : ''}
                            onClick={() => setPayMethod('pix')}
                            disabled={!!pixData}
                        >
                            PIX
                        </Button>
                    </div>

                    {payMethod === 'credit_card' ? (
                        <div className="space-y-3">
                            <div className="space-y-1">
                                <Label>Número do cartão</Label>
                                <Input
                                    value={cardData.number}
                                    onChange={(event) => setCardData({ ...cardData, number: event.target.value })}
                                    placeholder="0000 0000 0000 0000"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label>Nome impresso</Label>
                                <Input
                                    value={cardData.name}
                                    onChange={(event) => setCardData({ ...cardData, name: event.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Label>Validade</Label>
                                    <Input
                                        value={cardData.expiry}
                                        onChange={(event) => setCardData({ ...cardData, expiry: event.target.value })}
                                        placeholder="MM/AA"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label>CVV</Label>
                                    <Input
                                        value={cardData.cvv}
                                        onChange={(event) => setCardData({ ...cardData, cvv: event.target.value })}
                                        placeholder="123"
                                    />
                                </div>
                            </div>
                        </div>
                    ) : pixData ? (
                        <div className="space-y-3 text-center">
                            {pixData.url && (
                                <img src={pixData.url} alt="QR Code PIX" className="mx-auto h-44 w-44" />
                            )}
                            {pixData.code && (
                                <textarea
                                    readOnly
                                    value={pixData.code}
                                    className="w-full h-24 text-xs border rounded p-2"
                                />
                            )}
                            <p className="text-xs text-muted-foreground">
                                A fatura será marcada como paga automaticamente quando o PIX for confirmado.
                            </p>
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">
                            Gere um PIX no valor da fatura. A confirmação é automática.
                        </p>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setPayInvoice(null)}>
                            Fechar
                        </Button>
                        {payMethod === 'credit_card' && (
                            <Button
                                className="bg-wine"
                                onClick={handlePayInvoice}
                                disabled={processingPayment === payInvoice?.id}
                            >
                                {processingPayment === payInvoice?.id ? 'Processando...' : 'Pagar com cartão'}
                            </Button>
                        )}
                        {payMethod === 'pix' && !pixData && (
                            <Button
                                className="bg-wine"
                                onClick={handlePayInvoice}
                                disabled={processingPayment === payInvoice?.id}
                            >
                                {processingPayment === payInvoice?.id ? 'Gerando...' : 'Gerar PIX'}
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

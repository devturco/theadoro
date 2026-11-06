import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@theadoro/ui';
import { DataTable } from '@theadoro/ui';
import { Badge } from '@theadoro/ui';
import { useCRUD } from '@/hooks/useCRUD';
import {
    FileText,
    Search,
    Filter,
    CheckCircle2,
    Clock,
    XCircle,
    CreditCard
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@theadoro/ui';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@theadoro/ui';
import { toast } from 'sonner';

interface SellerInvoice {
    id: string;
    seller_id: string;
    subscription_id: string | null;
    amount: number;
    status: string;
    due_date: string;
    paid_at: string | null;
    payment_method: string | null;
    invoice_url: string | null;
    pix_code: string | null;
    pix_qr_url: string | null;
    created_at: string | null;
    updated_at: string | null;
    seller?: { full_name: string | null; email: string | null };
}

const AdminInvoices = () => {
    const [statusFilter, setStatusFilter] = useState<string>('all');

    const invoicesCRUD = useCRUD<SellerInvoice>({
        table: 'seller_invoices',
        select: `
      *,
      seller:seller_id (full_name, email)
    `,
        orderBy: { column: 'due_date', ascending: false }
    });

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'paid':
                return <Badge className="bg-green-100 text-green-800 border-green-200">Pago</Badge>;
            case 'pending':
                return <Badge className="bg-amber-100 text-amber-800 border-amber-200">Pendente</Badge>;
            case 'overdue':
                return <Badge className="bg-red-100 text-red-800 border-red-200">Atrasado</Badge>;
            case 'cancelled':
                return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Cancelado</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const handleMarkAsPaid = async (invoice: any) => {
        if (!confirm('Deseja marcar esta fatura como paga manualmente?')) return;

        try {
            await invoicesCRUD.updateItem(invoice.id, {
                status: 'paid',
                paid_at: new Date().toISOString(),
                payment_method: 'manual_admin'
            });
            toast.success('Fatura marcada como paga!');
            invoicesCRUD.refetch();
        } catch (error) {
            console.error('Error marking as paid:', error);
        }
    };

    const columns = [
        {
            key: 'seller.full_name',
            title: 'Vendedor',
            render: (_: any, row: any) => (
                <div className="flex flex-col">
                    <span className="font-medium">{row.seller?.full_name || 'N/A'}</span>
                    <span className="text-xs text-muted-foreground">{row.seller?.email}</span>
                </div>
            )
        },
        {
            key: 'amount',
            title: 'Valor',
            render: (value: number) => `R$ ${Number(value).toFixed(2)}`
        },
        {
            key: 'status',
            title: 'Status',
            render: (value: string) => getStatusBadge(value)
        },
        {
            key: 'due_date',
            title: 'Vencimento',
            render: (value: string) => format(new Date(value), "dd/MM/yyyy")
        },
        {
            key: 'paid_at',
            title: 'Pagamento',
            render: (value: string) => value ? format(new Date(value), "dd/MM/yyyy HH:mm") : '-'
        },
        {
            key: 'payment_method',
            title: 'Método',
            render: (value: string) => value ? (
                <span className="capitalize">{value.replace('_', ' ')}</span>
            ) : '-'
        }
    ];

    const actions = [
        {
            label: 'Marcar como Paga',
            icon: <CheckCircle2 className="h-4 w-4" />,
            onClick: (item: any) => handleMarkAsPaid(item),
            show: (item: any) => item.status === 'pending' || item.status === 'overdue'
        }
    ];

    const filteredInvoices = statusFilter === 'all'
        ? invoicesCRUD.data
        : invoicesCRUD.data.filter(inv => inv.status === statusFilter);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Faturas de Vendedores</h1>
                    <p className="text-muted-foreground">Monitore pagamentos e controle inadimplências.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-amber-50 border-amber-100">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-amber-600">Pendentes</p>
                                <h3 className="text-2xl font-bold text-amber-900">
                                    {invoicesCRUD.data.filter(i => i.status === 'pending').length}
                                </h3>
                            </div>
                            <Clock className="h-8 w-8 text-amber-500 opacity-50" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-red-50 border-red-100">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-red-600">Atrasadas</p>
                                <h3 className="text-2xl font-bold text-red-900">
                                    {invoicesCRUD.data.filter(i => i.status === 'overdue').length}
                                </h3>
                            </div>
                            <XCircle className="h-8 w-8 text-red-500 opacity-50" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-green-50 border-green-100">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-green-600">Pagas</p>
                                <h3 className="text-2xl font-bold text-green-900">
                                    {invoicesCRUD.data.filter(i => i.status === 'paid').length}
                                </h3>
                            </div>
                            <CheckCircle2 className="h-8 w-8 text-green-500 opacity-50" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-blue-50 border-blue-100">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-blue-600">Total</p>
                                <h3 className="text-2xl font-bold text-blue-900">
                                    {invoicesCRUD.data.length}
                                </h3>
                            </div>
                            <FileText className="h-8 w-8 text-blue-500 opacity-50" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <CreditCard className="h-5 w-5" />
                            Histórico de Faturamento
                        </CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Filtrar por Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos os Status</SelectItem>
                                <SelectItem value="paid">Pagas</SelectItem>
                                <SelectItem value="pending">Pendentes</SelectItem>
                                <SelectItem value="overdue">Atrasadas</SelectItem>
                                <SelectItem value="cancelled">Canceladas</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent>
                    <DataTable
                        data={filteredInvoices}
                        columns={columns}
                        loading={invoicesCRUD.loading}
                        actions={actions}
                        searchPlaceholder="Buscar por vendedor..."
                    />
                </CardContent>
            </Card>
        </div>
    );
};

export default AdminInvoices;

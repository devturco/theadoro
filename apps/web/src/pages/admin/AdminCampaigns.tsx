import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@theadoro/ui';
import { DataTable } from '@theadoro/ui';
import { Button } from '@theadoro/ui';
import { Badge } from '@theadoro/ui';
import { Input } from '@theadoro/ui';
import { Label } from '@theadoro/ui';
import { Textarea } from '@theadoro/ui';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@theadoro/ui';
import { Switch } from '@theadoro/ui';
import { useCRUD } from '@/hooks/useCRUD';
import { useRole } from '@/hooks/useRole';
import { toast } from 'sonner';
import { Megaphone, Plus, Edit, Trash2, ToggleLeft, ToggleRight, BadgePercent, Truck } from 'lucide-react';
import { DEFAULT_FREE_SHIPPING_THRESHOLD } from '@/lib/freeShipping';

interface Campaign {
    id: string;
    title: string;
    description?: string;
    discount_percentage: number;
    starts_at: string;
    ends_at: string;
    banner_url?: string | null;
    is_active: boolean;
    free_shipping_enabled?: boolean;
    free_shipping_threshold?: number | null;
    created_at: string;
}

interface CampaignFormData {
    title: string;
    description: string;
    discount_percentage: number;
    starts_at: string;
    ends_at: string;
    banner_url: string;
    is_active: boolean;
    free_shipping_enabled: boolean;
    free_shipping_threshold: number | null;
}

const formatDateTimeInput = (value?: string) => {
    if (!value) return '';

    const date = new Date(value);
    const pad = (input: number) => String(input).padStart(2, '0');

    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const INITIAL_FORM_DATA: CampaignFormData = {
    title: '',
    description: '',
    discount_percentage: 0,
    starts_at: '',
    ends_at: '',
    banner_url: '',
    is_active: true,
    free_shipping_enabled: false,
    free_shipping_threshold: null,
};

const AdminCampaigns = () => {
    const { isAdmin } = useRole();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
    const [formData, setFormData] = useState<CampaignFormData>(INITIAL_FORM_DATA);

    const {
        data: campaigns,
        loading,
        createItem,
        updateItem,
        deleteItem,
        refetch,
    } = useCRUD<Campaign>({ table: 'campaigns', pageSize: 20 });

    useEffect(() => {
        if (!isAdmin) {
            toast.error('Acesso negado. Apenas administradores podem acessar esta pagina.');
        }
    }, [isAdmin]);

    const resetForm = () => {
        setEditingCampaign(null);
        setFormData(INITIAL_FORM_DATA);
    };

    const handleEdit = (campaign: Campaign) => {
        setEditingCampaign(campaign);
        setFormData({
            title: campaign.title,
            description: campaign.description || '',
            discount_percentage: Number(campaign.discount_percentage || 0),
            starts_at: formatDateTimeInput(campaign.starts_at),
            ends_at: formatDateTimeInput(campaign.ends_at),
            banner_url: campaign.banner_url || '',
            is_active: campaign.is_active,
            free_shipping_enabled: Boolean(campaign.free_shipping_enabled),
            free_shipping_threshold: campaign.free_shipping_threshold ? Number(campaign.free_shipping_threshold) : null,
        });
        setIsDialogOpen(true);
    };

    const handleDelete = async (campaignId: string) => {
        if (!confirm('Tem certeza que deseja excluir esta campanha?')) return;

        try {
            await deleteItem(campaignId);
            refetch();
        } catch (error) {
            console.error('Erro ao excluir campanha:', error);
            toast.error('Erro ao excluir campanha');
        }
    };

    const handleToggleStatus = async (campaign: Campaign) => {
        try {
            await updateItem(campaign.id, { is_active: !campaign.is_active } as Partial<Campaign>);
            refetch();
        } catch (error) {
            console.error('Erro ao alterar campanha:', error);
            toast.error('Erro ao alterar status da campanha');
        }
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        try {
            const payload = {
                title: formData.title,
                description: formData.description,
                discount_percentage: Number(formData.discount_percentage || 0),
                starts_at: new Date(formData.starts_at).toISOString(),
                ends_at: new Date(formData.ends_at).toISOString(),
                banner_url: formData.banner_url || null,
                is_active: formData.is_active,
                free_shipping_enabled: formData.free_shipping_enabled,
                free_shipping_threshold: formData.free_shipping_enabled
                    ? (Number(formData.free_shipping_threshold) || DEFAULT_FREE_SHIPPING_THRESHOLD)
                    : null,
            };

            if (editingCampaign) {
                await updateItem(editingCampaign.id, payload as Partial<Campaign>);
            } else {
                await createItem(payload as Omit<Campaign, 'id' | 'created_at'>);
            }

            setIsDialogOpen(false);
            resetForm();
            refetch();
        } catch (error) {
            console.error('Erro ao salvar campanha:', error);
            toast.error('Erro ao salvar campanha');
        }
    };

    const columns = [
        {
            key: 'title',
            title: 'Campanha',
            render: (title: string, row: Campaign) => (
                <div className="space-y-1">
                    <div className="font-medium text-gray-900">{title}</div>
                    {row.description && <div className="text-xs text-gray-500 max-w-md">{row.description}</div>}
                </div>
            )
        },
        {
            key: 'discount_percentage',
            title: 'Desconto',
            render: (value: number) => `${Number(value || 0)}%`
        },
        {
            key: 'free_shipping_threshold',
            title: 'Frete gratis',
            render: (_: number | null, row: Campaign) => row.free_shipping_enabled
                ? `Acima de R$ ${Number(row.free_shipping_threshold || 0).toFixed(2)}`
                : 'Desativado'
        },
        {
            key: 'is_active',
            title: 'Status',
            render: (value: boolean) => (
                <Badge variant={value ? 'default' : 'secondary'}>
                    {value ? 'Ativa' : 'Inativa'}
                </Badge>
            )
        },
        {
            key: 'period',
            title: 'Periodo',
            render: (_: unknown, row: Campaign) => (
                <div className="text-xs text-gray-600">
                    <div>{new Date(row.starts_at).toLocaleDateString('pt-BR')}</div>
                    <div>ate {new Date(row.ends_at).toLocaleDateString('pt-BR')}</div>
                </div>
            )
        },
        {
            key: 'actions',
            title: 'Acoes',
            render: (_: unknown, row: Campaign) => (
                <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(row)}>
                        <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleToggleStatus(row)}>
                        {row.is_active ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(row.id)} className="text-red-500 hover:text-red-700">
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            )
        }
    ];

    if (!isAdmin) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">Acesso negado</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Campanhas</h1>
                    <p className="text-muted-foreground">
                        Crie campanhas promocionais e ative frete gratis por valor de carrinho.
                    </p>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={resetForm}>
                            <Plus className="h-4 w-4 mr-2" />
                            Nova campanha
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[620px] max-h-[90vh] flex flex-col overflow-hidden">
                        <DialogHeader>
                            <DialogTitle>{editingCampaign ? 'Editar campanha' : 'Nova campanha'}</DialogTitle>
                            <DialogDescription>
                                Configure descontos, periodo e a regra de frete gratis para os vendedores participantes.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                            <div className="flex-1 overflow-y-auto py-4 px-1 space-y-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="campaign_title">Titulo</Label>
                                    <Input
                                        id="campaign_title"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="campaign_description">Descricao</Label>
                                    <Textarea
                                        id="campaign_description"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        rows={3}
                                    />
                                </div>

                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="discount_percentage">Desconto (%)</Label>
                                        <Input
                                            id="discount_percentage"
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={formData.discount_percentage}
                                            onChange={(e) => setFormData({ ...formData, discount_percentage: Number(e.target.value) || 0 })}
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="banner_url">Banner URL</Label>
                                        <Input
                                            id="banner_url"
                                            value={formData.banner_url}
                                            onChange={(e) => setFormData({ ...formData, banner_url: e.target.value })}
                                            placeholder="https://..."
                                        />
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="starts_at">Inicio</Label>
                                        <Input
                                            id="starts_at"
                                            type="datetime-local"
                                            value={formData.starts_at}
                                            onChange={(e) => setFormData({ ...formData, starts_at: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="ends_at">Fim</Label>
                                        <Input
                                            id="ends_at"
                                            type="datetime-local"
                                            value={formData.ends_at}
                                            onChange={(e) => setFormData({ ...formData, ends_at: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="rounded-2xl border border-gray-100 p-4 bg-gray-50/40 space-y-4">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <Truck className="h-4 w-4 text-wine" />
                                                <Label className="font-semibold text-gray-900">Frete gratis por campanha</Label>
                                            </div>
                                            <p className="text-sm text-muted-foreground">
                                                Se ativado, o carrinho mostra o aviso quando o valor minimo for atingido.
                                            </p>
                                        </div>
                                        <Switch
                                            checked={formData.free_shipping_enabled}
                                            onCheckedChange={(checked) => setFormData({
                                                ...formData,
                                                free_shipping_enabled: checked,
                                                free_shipping_threshold: checked
                                                    ? (formData.free_shipping_threshold || DEFAULT_FREE_SHIPPING_THRESHOLD)
                                                    : null,
                                            })}
                                        />
                                    </div>

                                    {formData.free_shipping_enabled && (
                                        <div className="grid gap-2 max-w-xs">
                                            <Label htmlFor="free_shipping_threshold">Valor minimo do carrinho (R$)</Label>
                                            <Input
                                                id="free_shipping_threshold"
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={formData.free_shipping_threshold || ''}
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    free_shipping_threshold: e.target.value ? Number(e.target.value) : null,
                                                })}
                                                placeholder={DEFAULT_FREE_SHIPPING_THRESHOLD.toString()}
                                            />
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Switch
                                        id="campaign_active"
                                        checked={formData.is_active}
                                        onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                                    />
                                    <Label htmlFor="campaign_active">Campanha ativa</Label>
                                </div>
                            </div>

                            <DialogFooter className="pt-4 border-t">
                                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                    Cancelar
                                </Button>
                                <Button type="submit">
                                    {editingCampaign ? 'Salvar' : 'Criar'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Campanhas cadastradas</CardTitle>
                        <Megaphone className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{campaigns?.length || 0}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Campanhas ativas</CardTitle>
                        <ToggleRight className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{campaigns?.filter((campaign) => campaign.is_active).length || 0}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Frete gratis ativo</CardTitle>
                        <BadgePercent className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {campaigns?.filter((campaign) => campaign.free_shipping_enabled).length || 0}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Megaphone className="h-5 w-5" />
                        Lista de campanhas
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <DataTable
                        data={campaigns || []}
                        columns={columns}
                        loading={loading}
                        searchPlaceholder="Buscar campanhas..."
                    />
                </CardContent>
            </Card>
        </div>
    );
};

export default AdminCampaigns;

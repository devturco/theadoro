import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { useCRUD } from '@/hooks/useCRUD';
import {
    Plus,
    Edit,
    Trash2,
    Users,
    CreditCard,
    ShieldCheck,
    CheckCircle2,
    XCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PlanFormData {
    name: string;
    price: number;
    description: string;
    features: string[];
    is_active: boolean;
}

const AdminSubscriptions = () => {
    const [activeTab, setActiveTab] = useState('subscribers');
    const [isPlanDialogOpen, setIsPlanDialogOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState<any>(null);
    const [planFormData, setPlanFormData] = useState<PlanFormData>({
        name: '',
        price: 0,
        description: '',
        features: [''],
        is_active: true
    });

    // Subscribers CRUD (Read-only basically, but could extend)
    const subscribersCRUD = useCRUD({
        table: 'seller_subscriptions',
        select: `
      *,
      plan:plan_id (name),
      seller:seller_id (full_name, email)
    `
    });

    // Plans CRUD
    const plansCRUD = useCRUD({
        table: 'subscription_plans',
        orderBy: { column: 'price', ascending: true }
    });

    const handleEditPlan = (plan: any) => {
        setEditingPlan(plan);
        let parsedFeatures = [];
        if (typeof plan.features === 'string') {
            try {
                parsedFeatures = JSON.parse(plan.features);
            } catch (e) {
                parsedFeatures = [plan.features];
            }
        } else if (Array.isArray(plan.features)) {
            parsedFeatures = plan.features;
        }

        setPlanFormData({
            name: plan.name,
            price: Number(plan.price),
            description: plan.description || '',
            features: parsedFeatures.length > 0 ? parsedFeatures : [''],
            is_active: plan.is_active ?? true
        });
        setIsPlanDialogOpen(true);
    };

    const handleSavePlan = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Filter out empty features
            const cleanFeatures = planFormData.features.filter(f => f.trim() !== '');

            const payload = {
                name: planFormData.name,
                price: planFormData.price,
                description: planFormData.description,
                features: cleanFeatures,
                is_active: planFormData.is_active
            };

            if (editingPlan) {
                await plansCRUD.updateItem(editingPlan.id, payload);
            } else {
                await plansCRUD.createItem(payload);
            }

            setIsPlanDialogOpen(false);
            plansCRUD.refetch();
        } catch (error) {
            console.error('Error saving plan:', error);
        }
    };

    const handleAddFeature = () => {
        setPlanFormData({
            ...planFormData,
            features: [...planFormData.features, '']
        });
    };

    const handleRemoveFeature = (index: number) => {
        const newFeatures = [...planFormData.features];
        newFeatures.splice(index, 1);
        setPlanFormData({
            ...planFormData,
            features: newFeatures.length > 0 ? newFeatures : ['']
        });
    };

    const handleFeatureChange = (index: number, value: string) => {
        const newFeatures = [...planFormData.features];
        newFeatures[index] = value;
        setPlanFormData({
            ...planFormData,
            features: newFeatures
        });
    };

    const handleDeletePlan = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este plano? Isso pode afetar assinantes atuais.')) return;
        await plansCRUD.deleteItem(id);
    };

    const subscriberColumns = [
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
            key: 'plan.name',
            title: 'Plano',
            render: (value: string) => <Badge variant="outline">{value}</Badge>
        },
        {
            key: 'status',
            title: 'Status',
            render: (value: string) => (
                <Badge className={
                    value === 'active' ? 'bg-green-100 text-green-800' :
                        value === 'canceled' ? 'bg-gray-100 text-gray-800' :
                            'bg-red-100 text-red-800'
                }>
                    {value === 'active' ? 'Ativo' : value === 'canceled' ? 'Cancelado' : value}
                </Badge>
            )
        },
        {
            key: 'current_period_end',
            title: 'Vencimento',
            render: (value: string) => value ? format(new Date(value), "dd/MM/yyyy", { locale: ptBR }) : '-'
        }
    ];

    const planColumns = [
        {
            key: 'name',
            title: 'Nome',
            render: (value: string, row: any) => (
                <div className="flex items-center gap-2">
                    <span className="font-medium">{value}</span>
                    {!row.is_active && <Badge variant="secondary" className="text-[10px] h-4">Inativo</Badge>}
                </div>
            )
        },
        {
            key: 'price',
            title: 'Preço',
            render: (value: number) => `R$ ${Number(value).toFixed(2)}`
        },
        {
            key: 'is_active',
            title: 'Ativo',
            render: (value: boolean) => value ?
                <CheckCircle2 className="h-4 w-4 text-green-500" /> :
                <XCircle className="h-4 w-4 text-gray-300" />
        },
        {
            key: 'created_at',
            title: 'Criado em',
            render: (value: string) => format(new Date(value), "dd/MM/yyyy")
        }
    ];

    const planActions = [
        {
            label: 'Editar',
            icon: <Edit className="h-4 w-4" />,
            onClick: (item: any) => handleEditPlan(item)
        },
        {
            label: 'Excluir',
            icon: <Trash2 className="h-4 w-4" />,
            onClick: (item: any) => handleDeletePlan(item.id),
            variant: 'destructive' as const
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Gerenciar Assinaturas</h1>
                    <p className="text-muted-foreground">Controle planos, assinantes e faturamento.</p>
                </div>
                <Button onClick={() => {
                    setEditingPlan(null);
                    setPlanFormData({ name: '', price: 0, description: '', features: [''], is_active: true });
                    setIsPlanDialogOpen(true);
                }}>
                    <Plus className="h-4 w-4 mr-2" /> Novo Plano
                </Button>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full max-w-md grid-cols-2">
                    <TabsTrigger value="subscribers" className="flex items-center gap-2">
                        <Users className="h-4 w-4" /> Assinantes
                    </TabsTrigger>
                    <TabsTrigger value="plans" className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" /> Planos
                    </TabsTrigger>
                </TabsList>

                <Card className="mt-6">
                    <CardHeader>
                        <CardTitle>
                            {activeTab === 'subscribers' ? 'Vendedores Assinantes' : 'Planos de Assinatura'}
                        </CardTitle>
                        <CardDescription>
                            {activeTab === 'subscribers'
                                ? 'Lista de todos os vendedores com assinaturas ativas ou canceladas.'
                                : 'Defina os nomes, preços e funcionalidades dos planos oferecidos.'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {activeTab === 'subscribers' ? (
                            <DataTable
                                data={subscribersCRUD.data}
                                columns={subscriberColumns}
                                loading={subscribersCRUD.loading}
                                searchPlaceholder="Buscar vendedor..."
                            />
                        ) : (
                            <DataTable
                                data={plansCRUD.data}
                                columns={planColumns}
                                loading={plansCRUD.loading}
                                actions={planActions}
                            />
                        )}
                    </CardContent>
                </Card>
            </Tabs>

            {/* Plan Edit/Create Dialog */}
            <Dialog open={isPlanDialogOpen} onOpenChange={setIsPlanDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>{editingPlan ? 'Editar Plano' : 'Criar Novo Plano'}</DialogTitle>
                        <DialogDescription>
                            Ajuste as configurações do plano para os vendedores.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSavePlan} className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nome do Plano</Label>
                                <Input
                                    id="name"
                                    value={planFormData.name}
                                    onChange={(e) => setPlanFormData({ ...planFormData, name: e.target.value })}
                                    placeholder="Ex: Start"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="price">Preço Mensal (R$)</Label>
                                <Input
                                    id="price"
                                    type="number"
                                    step="0.01"
                                    value={planFormData.price}
                                    onChange={(e) => setPlanFormData({ ...planFormData, price: Number(e.target.value) })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Descrição Curta</Label>
                            <Input
                                id="description"
                                value={planFormData.description}
                                onChange={(e) => setPlanFormData({ ...planFormData, description: e.target.value })}
                                placeholder="Uma breve descrição do público alvo"
                            />
                        </div>

                        <div className="space-y-3">
                            <Label>Funcionalidades do Plano</Label>
                            <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                                {planFormData.features.map((feature, index) => (
                                    <div key={index} className="flex gap-2">
                                        <Input
                                            value={feature}
                                            onChange={(e) => handleFeatureChange(index, e.target.value)}
                                            placeholder={`Ex: Funcionalidade ${index + 1}`}
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="text-red-500 shrink-0"
                                            onClick={() => handleRemoveFeature(index)}
                                            disabled={planFormData.features.length === 1 && feature === ''}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="w-full border-dashed"
                                onClick={handleAddFeature}
                            >
                                <Plus className="h-4 w-4 mr-2" /> Adicionar Item
                            </Button>
                        </div>

                        <div className="flex items-center space-x-2 pt-2">
                            <Switch
                                id="is_active"
                                checked={planFormData.is_active}
                                onCheckedChange={(checked) => setPlanFormData({ ...planFormData, is_active: checked })}
                            />
                            <Label htmlFor="is_active">Plano Ativo para novos assinantes</Label>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setIsPlanDialogOpen(false)}>Cancelar</Button>
                            <Button type="submit">Salvar Plano</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AdminSubscriptions;

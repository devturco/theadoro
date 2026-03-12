
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { FileUpload } from '@/components/ui/file-upload';
import { useAuth } from '@/contexts/AuthContext';
import { useCRUD } from '@/hooks/useCRUD';
import {
    Gift,
    Plus,
    Edit,
    Trash2,
    ToggleLeft,
    ToggleRight,
    DollarSign
} from 'lucide-react';
import { toast } from 'sonner';
import { GiftWrap } from '@/types/order';

interface GiftWrapFormData {
    name: string;
    description: string;
    price: number;
    image_url: string;
    is_active: boolean;
    seller_id: string; // Add seller_id explicitly
}

const SellerGiftWraps = () => {
    const { user } = useAuth();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingGiftWrap, setEditingGiftWrap] = useState<GiftWrap | null>(null);

    // Initialize with user.id, but update in useEffect if user is not ready
    const [formData, setFormData] = useState<GiftWrapFormData>({
        name: '',
        description: '',
        price: 0,
        image_url: '',
        is_active: true,
        seller_id: user?.id || ''
    });

    useEffect(() => {
        if (user?.id) {
            setFormData(prev => ({ ...prev, seller_id: user.id }));
        }
    }, [user]);

    const {
        data: allGiftWraps, // We'll filter this ourselves or ideally fetch filtered
        loading,
        createItem,
        updateItem,
        deleteItem,
        refetch
    } = useCRUD<GiftWrap>({ table: 'gift_wraps' });

    // Filter wraps for current seller
    const giftWraps = allGiftWraps?.filter(w => w.seller_id === user?.id) || [];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user?.id) {
            toast.error('Erro de autenticação. Recarregue a página.');
            return;
        }

        try {
            if (editingGiftWrap) {
                await updateItem(editingGiftWrap.id, {
                    ...formData,
                    seller_id: user.id // Ensure seller_id is preserved/set
                });
                toast.success('Embalagem atualizada com sucesso!');
            } else {
                await createItem({
                    ...formData,
                    seller_id: user.id
                });
                toast.success('Embalagem criada com sucesso!');
            }

            setIsDialogOpen(false);
            resetForm();
            refetch();
        } catch (error) {
            console.error('Erro ao salvar embalagem:', error);
            toast.error('Erro ao salvar embalagem');
        }
    };

    const handleEdit = (giftWrap: GiftWrap) => {
        setEditingGiftWrap(giftWrap);
        setFormData({
            name: giftWrap.name,
            description: giftWrap.description || '',
            price: giftWrap.price,
            image_url: giftWrap.image_url || '',
            is_active: giftWrap.is_active,
            seller_id: giftWrap.seller_id || user?.id || ''
        });
        setIsDialogOpen(true);
    };

    const handleDelete = async (giftWrapId: string) => {
        if (!confirm('Tem certeza que deseja excluir esta embalagem?')) return;

        try {
            await deleteItem(giftWrapId);
            toast.success('Embalagem excluída com sucesso!');
            refetch();
        } catch (error) {
            console.error('Erro ao excluir embalagem:', error);
            toast.error('Erro ao excluir embalagem');
        }
    };

    const handleToggleStatus = async (giftWrap: GiftWrap) => {
        try {
            await updateItem(giftWrap.id, {
                is_active: !giftWrap.is_active
            });
            toast.success(`Embalagem ${giftWrap.is_active ? 'desativada' : 'ativada'} com sucesso!`);
            refetch();
        } catch (error) {
            console.error('Erro ao alterar status:', error);
            toast.error('Erro ao alterar status da embalagem');
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            price: 0,
            image_url: '',
            is_active: true,
            seller_id: user?.id || ''
        });
        setEditingGiftWrap(null);
    };

    const columns = [
        {
            key: 'name',
            title: 'Nome',
            render: (name: string, row: GiftWrap) => (
                <div className="flex items-center gap-3">
                    {row.image_url ? (
                        <img src={row.image_url} alt={name} className="h-10 w-10 rounded object-cover border" />
                    ) : (
                        <div className="h-10 w-10 rounded bg-gray-100 flex items-center justify-center border">
                            <Gift className="h-5 w-5 text-gray-400" />
                        </div>
                    )}
                    <span className="font-medium">{name}</span>
                </div>
            )
        },
        {
            key: 'price',
            title: 'Preço',
            render: (price: number) => `R$ ${Number(price).toFixed(2)}`
        },
        {
            key: 'is_active',
            title: 'Status',
            render: (isActive: boolean) => (
                <Badge variant={isActive ? 'default' : 'secondary'}>
                    {isActive ? 'Ativa' : 'Inativa'}
                </Badge>
            )
        },
        {
            key: 'created_at',
            title: 'Data de Criação',
            render: (value: string) => value ? new Date(value).toLocaleDateString('pt-BR') : '-'
        },
        {
            key: 'actions',
            title: 'Ações',
            render: (_: any, row: GiftWrap) => (
                <div className="flex gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(row)}
                    >
                        <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleStatus(row)}
                    >
                        {row.is_active ? (
                            <ToggleRight className="h-4 w-4" />
                        ) : (
                            <ToggleLeft className="h-4 w-4" />
                        )}
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(row.id)}
                        className="text-red-500 hover:text-red-700"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            )
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Minhas Embalagens</h1>
                    <p className="text-muted-foreground">
                        Cadastre e gerencie as opções de embalagens para presente da sua loja
                    </p>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={resetForm}>
                            <Plus className="h-4 w-4 mr-2" />
                            Nova Embalagem
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col overflow-hidden">
                        <DialogHeader>
                            <DialogTitle>
                                {editingGiftWrap ? 'Editar Embalagem' : 'Nova Embalagem'}
                            </DialogTitle>
                            <DialogDescription>
                                {editingGiftWrap
                                    ? 'Edite as informações da embalagem abaixo.'
                                    : 'Preencha as informações para criar uma nova opção de embalagem.'
                                }
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                            <div className="flex-1 overflow-y-auto py-4 px-1">
                                <div className="grid gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="name">Nome</Label>
                                        <Input
                                            id="name"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="Ex: Caixa Premium, Papel Kraft..."
                                            required
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="price">Preço (R$)</Label>
                                        <div className="relative">
                                            <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="price"
                                                type="number"
                                                step="0.01"
                                                className="pl-9"
                                                value={formData.price}
                                                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                                                placeholder="0.00"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="grid gap-2">
                                        <Label>Imagem da Embalagem</Label>
                                        {formData.image_url && (
                                            <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-muted">
                                                <img
                                                    src={formData.image_url}
                                                    alt="Preview"
                                                    className="h-full w-full object-cover"
                                                />
                                                <Button
                                                    type="button"
                                                    variant="destructive"
                                                    size="sm"
                                                    className="absolute right-2 top-2 h-8 w-8 rounded-full p-0"
                                                    onClick={() => setFormData({ ...formData, image_url: '' })}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        )}
                                        <FileUpload
                                            onUpload={(urls) => setFormData({ ...formData, image_url: urls[0] })}
                                            accept="image/*"
                                            options={{ bucket: 'products' }}
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="description">Descrição</Label>
                                        <Textarea
                                            id="description"
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            placeholder="Descreva os materiais e estilo..."
                                            rows={3}
                                        />
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <Switch
                                            id="is_active"
                                            checked={formData.is_active}
                                            onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                                        />
                                        <Label htmlFor="is_active">Embalagem ativa para clientes</Label>
                                    </div>
                                </div>
                            </div>
                            <DialogFooter className="pt-4 border-t">
                                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                    Cancelar
                                </Button>
                                <Button type="submit">
                                    {editingGiftWrap ? 'Salvar' : 'Criar'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total de Opções</CardTitle>
                        <Gift className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{giftWraps.length}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Ativas</CardTitle>
                        <ToggleRight className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {giftWraps.filter(w => w.is_active).length}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Preço Médio</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            R$ {giftWraps.length > 0
                                ? (giftWraps.reduce((acc, w) => acc + Number(w.price), 0) / giftWraps.length).toFixed(2)
                                : '0.00'}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Gift className="h-5 w-5" />
                        Minha Lista de Embalagens
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <DataTable
                        data={giftWraps}
                        columns={columns}
                        loading={loading}
                        searchPlaceholder="Buscar embalagens..."
                    />
                </CardContent>
            </Card>
        </div>
    );
};

export default SellerGiftWraps;

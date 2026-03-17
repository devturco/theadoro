
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@theadoro/ui';
import { Button } from '@theadoro/ui';
import { Input } from '@theadoro/ui';
import { Label } from '@theadoro/ui';
import { Badge } from '@theadoro/ui';
import { Switch } from '@theadoro/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@theadoro/ui';
import { Ticket, Plus, Trash2, Calendar, DollarSign, Percent, X, ChevronRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { couponService, Coupon } from '@/services/coupon.service';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export default function SellerCoupons() {
    const { user } = useAuth();
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);

    const [formData, setFormData] = useState({
        code: '',
        discount_type: 'percentage' as 'percentage' | 'fixed',
        discount_value: 0,
        min_purchase: 0,
        expiration_date: '',
        usage_limit: ''
    });

    useEffect(() => {
        if (user) loadCoupons();
    }, [user]);

    const loadCoupons = async () => {
        try {
            setLoading(true);
            const { data } = await couponService.getBySeller(user!.id);
            setCoupons(data || []);
        } catch (error) {
            console.error('Error loading coupons:', error);
            toast.error('Erro ao carregar cupons.');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.code || formData.discount_value <= 0) {
            toast.error('Preencha os campos obrigatórios.');
            return;
        }

        try {
            const newCoupon = {
                code: formData.code.toUpperCase().trim(),
                seller_id: user!.id,
                discount_type: formData.discount_type,
                discount_value: Number(formData.discount_value),
                min_purchase: Number(formData.min_purchase),
                usage_limit: formData.usage_limit ? Number(formData.usage_limit) : undefined,
                expiration_date: formData.expiration_date || undefined,
                used_count: 0,
                is_active: true
            };

            const { error } = await couponService.create(newCoupon as any);
            if (error) throw error;

            toast.success('Cupom criado com sucesso!');
            setIsAdding(false);
            setFormData({ code: '', discount_type: 'percentage', discount_value: 0, min_purchase: 0, expiration_date: '', usage_limit: '' });
            loadCoupons();
        } catch (error: any) {
            toast.error(error.message || 'Erro ao criar cupom.');
        }
    };

    const toggleStatus = async (coupon: Coupon) => {
        try {
            const { error } = await couponService.updateStatus(coupon, !coupon.is_active);
            if (error) throw error;
            
            await loadCoupons();
            toast.success(`Cupom ${!coupon.is_active ? 'ativado' : 'desativado'}!`);
        } catch (error: any) {
            console.error('Error updating status:', error);
            toast.error(error.message || 'Erro ao atualizar status.');
        }
    };

    const handleDelete = async (coupon: Coupon) => {
        if (!confirm('Tem certeza que deseja excluir este cupom?')) return;
        try {
            const { error } = await couponService.remove(coupon);
            if (error) throw error;

            await loadCoupons();
            toast.success('Cupom excluído!');
        } catch (error: any) {
            console.error('Error deleting coupon:', error);
            toast.error(error.message || 'Erro ao excluir cupom.');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Meus Cupons</h1>
                    <p className="text-muted-foreground text-sm">Gerencie códigos de desconto para seus produtos.</p>
                </div>
                <Button onClick={() => setIsAdding(!isAdding)} className="bg-wine hover:bg-wine/90">
                    {isAdding ? 'Cancelar' : (
                        <><Plus className="mr-2 h-4 w-4" /> Novo Cupom</>
                    )}
                </Button>
            </div>

            {isAdding && (
                <Card className="border-wine/20 shadow-lg animate-in slide-in-from-top-4 duration-300">
                    <CardHeader>
                        <CardTitle className="text-lg">Configurar Novo Voucher</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleCreate} className="grid md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <Label>Código do Cupom</Label>
                                <Input 
                                    placeholder="EX: PRESENTEMAE10" 
                                    value={formData.code}
                                    onChange={e => setFormData({...formData, code: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Tipo de Desconto</Label>
                                <Select 
                                    value={formData.discount_type}
                                    onValueChange={(val: any) => setFormData({...formData, discount_type: val})}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="percentage">Porcentagem (%)</SelectItem>
                                        <SelectItem value="fixed">Valor Fixo (R$)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Valor do Desconto</Label>
                                <div className="relative">
                                    <Input 
                                        type="number" 
                                        value={formData.discount_value || ''}
                                        onChange={e => setFormData({...formData, discount_value: Number(e.target.value)})}
                                    />
                                    <div className="absolute right-3 top-2.5 text-gray-400">
                                        {formData.discount_type === 'percentage' ? <Percent className="h-4 w-4" /> : <DollarSign className="h-4 w-4" />}
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Valor Mínimo Compra (R$)</Label>
                                <Input 
                                    type="number" 
                                    value={formData.min_purchase || ''}
                                    onChange={e => setFormData({...formData, min_purchase: Number(e.target.value)})}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Data de Expiração (Opcional)</Label>
                                <Input 
                                    type="date" 
                                    value={formData.expiration_date}
                                    onChange={e => setFormData({...formData, expiration_date: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Limite de Uso (Opcional)</Label>
                                <Input 
                                    type="number" 
                                    placeholder="Sem limite"
                                    value={formData.usage_limit}
                                    onChange={e => setFormData({...formData, usage_limit: e.target.value})}
                                />
                            </div>
                            <div className="md:col-span-3 flex justify-end pt-4">
                                <Button type="submit" className="bg-wine">Criar e Ativar Cupom</Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            <div className="grid gap-4">
                {loading ? (
                    <div className="text-center py-12">Carregando seus cupons...</div>
                ) : coupons.length === 0 ? (
                    <Card className="p-12 text-center border-dashed">
                        <Ticket className="h-12 w-12 text-gray-200 mx-auto mb-4" />
                        <p className="text-gray-500">Você ainda não tem nenhum cupom cadastrado.</p>
                    </Card>
                ) : (
                    coupons.map((coupon, index) => (
                        <Card key={coupon.id || `coupon-${coupon.code}-${index}`} className={cn("overflow-hidden border-l-4", coupon.is_active ? "border-l-green-500" : "border-l-gray-300")}>
                            <CardContent className="p-6">
                                <div className="flex flex-col md:flex-row justify-between gap-6">
                                    <div className="flex gap-4">
                                        <div className={cn("p-4 rounded-xl flex items-center justify-center h-16 w-16", coupon.is_active ? "bg-green-50 text-green-600" : "bg-gray-50 text-gray-400")}>
                                            {coupon.discount_type === 'percentage' ? <Percent className="h-8 w-8" /> : <DollarSign className="h-8 w-8" />}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xl font-black tracking-tighter text-gray-900">{coupon.code}</span>
                                                <Badge variant={coupon.is_active ? 'default' : 'secondary'} className={cn(coupon.is_active ? "bg-green-500" : "")}>
                                                    {coupon.is_active ? 'Ativo' : 'Pausado'}
                                                </Badge>
                                            </div>
                                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                                                <span className="flex items-center gap-1">
                                                    <Badge variant="outline" className="text-xs">
                                                        {coupon.discount_type === 'percentage' ? `${coupon.discount_value}% OFF` : `R$ ${coupon.discount_value} OFF`}
                                                    </Badge>
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    Min: R$ {Number(coupon.min_purchase || 0).toFixed(2)}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    {coupon.expiration_date ? format(new Date(coupon.expiration_date), "dd 'de' MMM", { locale: ptBR }) : 'Sem validade'}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    Usos: {coupon.used_count} {coupon.usage_limit ? `/ ${coupon.usage_limit}` : ''}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-2 mr-4">
                                            <Label className="text-xs text-gray-400">Status</Label>
                                            <Switch checked={coupon.is_active} onCheckedChange={() => toggleStatus(coupon)} />
                                        </div>
                                        <Button variant="ghost" size="icon" className="text-gray-400 hover:text-red-500" onClick={() => handleDelete(coupon)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}

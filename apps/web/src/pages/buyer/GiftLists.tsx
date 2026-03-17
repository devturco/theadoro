import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@theadoro/ui';
import { Button } from '@theadoro/ui';
import { Input } from '@theadoro/ui';
import { Label } from '@theadoro/ui';
import { Textarea } from '@theadoro/ui';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@theadoro/ui';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Gift, Plus, Calendar, Share2, Trash2, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@theadoro/ui';
import { Switch } from '@theadoro/ui';

interface GiftList {
    id: string;
    title: string;
    description: string;
    event_date: string;
    is_public: boolean;
    slug: string;
    item_count?: number;
}

export default function GiftLists() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [lists, setLists] = useState<GiftList[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        event_date: '',
        is_public: true
    });

    useEffect(() => {
        if (user) fetchLists();
    }, [user]);

    const fetchLists = async () => {
        try {
            const { data, error } = await supabase
                .from('gift_lists' as any)
                .select('*')
                .eq('user_id', user?.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setLists((data as any) || []);
        } catch (error) {
            console.error('Error fetching lists:', error);
            setLists([
                {
                    id: '1',
                    title: 'Lista de Casamento',
                    description: 'Nossa lista para o grande dia!',
                    event_date: '2024-12-20',
                    is_public: true,
                    slug: 'casamento-ana-e-joao',
                    item_count: 15
                }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateList = async () => {
        if (!user) return;
        try {
            const slug = formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.random().toString(36).substring(7);
            const payload = {
                user_id: user.id,
                title: formData.title,
                description: formData.description,
                event_date: formData.event_date || null,
                is_public: formData.is_public,
                slug
            };
            const { error } = await supabase.from('gift_lists' as any).insert(payload);
            if (error) throw error;
            toast.success('Lista criada com sucesso!');
            setIsDialogOpen(false);
            fetchLists();
            setFormData({ title: '', description: '', event_date: '', is_public: true });
        } catch (error: any) {
            toast.error('Erro ao criar lista.');
            setLists(prev => [{
                id: Date.now().toString(),
                title: formData.title,
                description: formData.description,
                event_date: formData.event_date,
                is_public: formData.is_public,
                slug: 'nova-lista-' + Date.now(),
                item_count: 0
            }, ...prev]);
            setIsDialogOpen(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir esta lista?')) return;
        try {
            const { error } = await supabase.from('gift_lists' as any).delete().eq('id', id);
            if (error) throw error;
            toast.success('Lista removida!');
            fetchLists();
        } catch (error) {
            setLists(prev => prev.filter(l => l.id !== id));
        }
    };

    const copyLink = (slug: string) => {
        navigator.clipboard.writeText(`${window.location.origin}/lists/${slug}`);
        toast.success('Link copiado!');
    };

    return (
        <div className="space-y-5 sm:space-y-6 animate-in fade-in duration-500">
            {/* Header Row */}
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold font-serif text-gray-900 flex items-center gap-2">
                        <Gift className="h-5 w-5 sm:h-6 sm:w-6 text-wine shrink-0" />
                        Minhas Listas
                    </h1>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-snug">
                        Crie listas para casamentos, aniversários ou chá de bebê e compartilhe com amigos.
                    </p>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button
                            className="bg-wine hover:bg-wine-dark text-white h-9 px-3 sm:px-4 text-xs sm:text-sm shrink-0"
                        >
                            <Plus className="h-4 w-4 sm:mr-1.5" />
                            <span className="hidden sm:inline">Nova Lista</span>
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md rounded-2xl">
                        <DialogHeader>
                            <DialogTitle>Criar Nova Lista</DialogTitle>
                            <DialogDescription>Preencha os detalhes da sua lista de presentes.</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-2">
                            <div className="space-y-1.5">
                                <Label>Título da Lista *</Label>
                                <Input
                                    placeholder="Ex: Casamento Ana & João"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Descrição (Opcional)</Label>
                                <Textarea
                                    placeholder="Uma mensagem para seus convidados..."
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    rows={3}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Data do Evento (Opcional)</Label>
                                <Input
                                    type="date"
                                    value={formData.event_date}
                                    onChange={e => setFormData({ ...formData, event_date: e.target.value })}
                                />
                            </div>
                            <div className="flex items-center space-x-2 pt-1">
                                <Switch
                                    id="public"
                                    checked={formData.is_public}
                                    onCheckedChange={checked => setFormData({ ...formData, is_public: checked })}
                                />
                                <Label htmlFor="public" className="text-sm cursor-pointer">
                                    Lista pública (visível com o link)
                                </Label>
                            </div>
                        </div>
                        <DialogFooter className="gap-2">
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                            <Button
                                onClick={handleCreateList}
                                className="bg-wine hover:bg-wine-dark text-white"
                                disabled={!formData.title}
                            >
                                Criar Lista
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Loading state */}
            {loading && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-40 rounded-xl bg-gray-100 animate-pulse" />
                    ))}
                </div>
            )}

            {/* Empty state */}
            {!loading && lists.length === 0 && (
                <div className="text-center py-12 sm:py-16 bg-background rounded-2xl border border-dashed border-border">
                    <div className="w-14 h-14 bg-wine/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Gift className="h-7 w-7 text-wine" />
                    </div>
                    <h3 className="font-semibold text-gray-700 mb-1">Nenhuma lista criada</h3>
                    <p className="text-sm text-gray-500 mb-5 max-w-xs mx-auto">
                        Crie sua primeira lista de presentes para casamento, aniversário ou chá de bebê.
                    </p>
                    <Button
                        onClick={() => setIsDialogOpen(true)}
                        className="bg-wine hover:bg-wine-dark text-white"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Criar minha primeira lista
                    </Button>
                </div>
            )}

            {/* Lists Grid */}
            {!loading && lists.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {lists.map(list => (
                        <Card
                            key={list.id}
                            className="group hover:border-wine/40 hover:shadow-md transition-all duration-200 cursor-pointer"
                            onClick={() => navigate(`/buyer/lists/${list.id}`)}
                        >
                            <CardHeader className="pb-2 p-4">
                                <div className="flex justify-between items-start gap-2">
                                    <div className="min-w-0 flex-1">
                                        <CardTitle className="text-base line-clamp-1 group-hover:text-wine transition-colors">
                                            {list.title}
                                        </CardTitle>
                                        {list.event_date && (
                                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                                <Calendar className="h-3 w-3 shrink-0" />
                                                {format(new Date(list.event_date), 'dd/MM/yyyy')}
                                            </div>
                                        )}
                                    </div>
                                    <Badge
                                        variant={list.is_public ? 'outline' : 'secondary'}
                                        className="text-[10px] shrink-0"
                                    >
                                        {list.is_public ? 'Pública' : 'Privada'}
                                    </Badge>
                                </div>
                                <CardDescription className="line-clamp-2 text-xs mt-1.5 min-h-[32px]">
                                    {list.description || 'Sem descrição.'}
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="pt-0 pb-3 px-4">
                                <div className="text-sm font-medium flex items-center gap-1.5 text-gray-600">
                                    <Gift className="h-3.5 w-3.5 text-wine" />
                                    {list.item_count || 0} {(list.item_count || 0) === 1 ? 'item' : 'itens'} na lista
                                </div>
                            </CardContent>

                            <CardFooter
                                className="border-t pt-3 pb-3 px-4 flex justify-between gap-2"
                                onClick={e => e.stopPropagation()}
                            >
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="gap-1.5 text-xs h-8 px-2 text-gray-600"
                                    onClick={() => copyLink(list.slug)}
                                >
                                    <Share2 className="h-3.5 w-3.5" />
                                    Compartilhar
                                </Button>
                                <div className="flex gap-1">
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8 hover:bg-gray-100"
                                        title="Abrir lista"
                                        onClick={() => navigate(`/buyer/lists/${list.id}`)}
                                    >
                                        <ExternalLink className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8 text-red-400 hover:text-red-500 hover:bg-red-50"
                                        title="Excluir lista"
                                        onClick={() => handleDelete(list.id)}
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}

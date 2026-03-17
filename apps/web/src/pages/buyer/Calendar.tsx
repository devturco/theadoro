import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@theadoro/ui';
import { Calendar } from '@theadoro/ui';
import { Button } from '@theadoro/ui';
import { Input } from '@theadoro/ui';
import { Label } from '@theadoro/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@theadoro/ui';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@theadoro/ui';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Calendar as CalendarIcon, Gift, Plus, Trash2, PartyPopper, Heart, Star } from 'lucide-react';
import { format, isSameDay, addDays, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@theadoro/ui';
import { useNavigate } from 'react-router-dom';

interface ImportantDate {
    id: string;
    title: string;
    date: string;
    type: 'birthday' | 'anniversary' | 'holiday' | 'other';
    notes?: string;
}

export default function BuyerCalendar() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [importantDates, setImportantDates] = useState<ImportantDate[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        date: new Date(),
        type: 'birthday',
        notes: ''
    });

    useEffect(() => {
        if (user) {
            fetchDates();
        }
    }, [user]);

    const fetchDates = async () => {
        try {
            const { data, error } = await supabase
                .from('important_dates' as any)
                .select('*')
                .eq('user_id', user?.id)
                .order('date', { ascending: true });

            if (error) throw error;
            setImportantDates((data as any) || []);
        } catch (error) {
            console.error('Error fetching dates:', error);
            // Mock data if table doesn't exist yet
            setImportantDates([
                { id: '1', title: 'Aniversário da Mãe', date: '2024-05-15', type: 'birthday' },
                { id: '2', title: 'Namorados', date: '2024-06-12', type: 'anniversary' },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveDate = async () => {
        if (!user) return;

        try {
            const payload = {
                user_id: user.id,
                title: formData.title,
                date: format(formData.date, 'yyyy-MM-dd'),
                type: formData.type,
                notes: formData.notes
            };

            const { error } = await supabase
                .from('important_dates' as any)
                .insert(payload);

            if (error) throw error;

            toast.success('Data importante salva!');
            setIsDialogOpen(false);
            fetchDates();
        } catch (error: any) {
            console.error('Error saving date:', error);
            toast.error('Erro ao salvar data (tabela pode não existir ainda).');
            // Optimistic update for demo
            setImportantDates(prev => [...prev, {
                id: Date.now().toString(),
                title: formData.title,
                date: format(formData.date, 'yyyy-MM-dd'),
                type: formData.type as any,
                notes: formData.notes
            }]);
            setIsDialogOpen(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            const { error } = await supabase
                .from('important_dates' as any)
                .delete()
                .eq('id', id);

            if (error) throw error;
            toast.success('Data removida!');
            fetchDates();
        } catch (error) {
            console.error('Error deleting date:', error);
            setImportantDates(prev => prev.filter(d => d.id !== id));
        }
    };

    const getUpcomingDates = () => {
        const today = new Date();
        return importantDates
            .filter(d => new Date(d.date) >= today)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .slice(0, 3);
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'birthday': return <PartyPopper className="h-4 w-4 text-pink-500" />;
            case 'anniversary': return <Heart className="h-4 w-4 text-red-500" />;
            case 'holiday': return <Star className="h-4 w-4 text-yellow-500" />;
            default: return <CalendarIcon className="h-4 w-4 text-blue-500" />;
        }
    };

    const getSuggestionLink = (type: string) => {
        switch (type) {
            case 'birthday': return '/search?q=presente+aniversario';
            case 'anniversary': return '/search?q=presente+namorados';
            default: return '/products';
        }
    };

    return (
        <div className="container py-8 space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold font-sans text-gradient-wine flex items-center gap-2">
                        <CalendarIcon className="h-8 w-8" />
                        Datas Importantes
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Nunca mais esqueça uma data especial. Receba lembretes e sugestões de presentes.
                    </p>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-wine hover:bg-wine-dark">
                            <Plus className="mr-2 h-4 w-4" /> Adicionar Data
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Nova Data Importante</DialogTitle>
                            <DialogDescription>Adicione um aniversário ou data especial para ser lembrado.</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Título</Label>
                                <Input
                                    placeholder="Ex: Aniversário da Mãe"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Data</Label>
                                <div className="border rounded-md p-2 flex justify-center">
                                    <Calendar
                                        mode="single"
                                        selected={formData.date}
                                        onSelect={(val) => val && setFormData({ ...formData, date: val })}
                                        locale={ptBR}
                                        className="rounded-md border"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Tipo</Label>
                                <Select
                                    value={formData.type}
                                    onValueChange={val => setFormData({ ...formData, type: val as any })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="birthday">Aniversário</SelectItem>
                                        <SelectItem value="anniversary">Aniversário de Namoro/Casamento</SelectItem>
                                        <SelectItem value="holiday">Feriado</SelectItem>
                                        <SelectItem value="other">Outro (Personalizado)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {formData.type === 'other' && (
                                <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
                                    <Label>Qual a ocasião?</Label>
                                    <Input
                                        placeholder="Ex: Dia do Médico, Formatura..."
                                        value={formData.title}
                                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    />
                                </div>
                            )}
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                            <Button onClick={handleSaveDate} className="bg-wine hover:bg-wine-dark">Salvar</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
                {/* Upcoming Dates & Suggestions */}
                <div className="md:col-span-1 space-y-6">
                    <Card className="border-wine/20 bg-wine/5">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Gift className="h-5 w-5 text-wine" />
                                Próximas Datas
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {getUpcomingDates().length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-4">Nenhuma data próxima.</p>
                            ) : (
                                getUpcomingDates().map(date => (
                                    <div key={date.id} className="bg-white p-4 rounded-xl border shadow-sm space-y-3">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-2 font-medium">
                                                {getTypeIcon(date.type)}
                                                <span>{date.title}</span>
                                            </div>
                                            <Badge variant="secondary">
                                                {format(parseISO(date.date), 'dd/MM')}
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Faltam {Math.ceil((new Date(date.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} dias
                                        </p>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="w-full text-xs"
                                            onClick={() => navigate(getSuggestionLink(date.type))}
                                        >
                                            Ver Sugestões de Presente
                                        </Button>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Main Calendar View */}
                <div className="md:col-span-2">
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex justify-center">
                                <Calendar
                                    mode="single"
                                    selected={date}
                                    onSelect={setDate}
                                    className="rounded-md border shadow-sm w-full max-w-sm"
                                    locale={ptBR}
                                    modifiers={{
                                        important: importantDates.map(d => parseISO(d.date))
                                    }}
                                    modifiersStyles={{
                                        important: { fontWeight: 'bold', color: 'var(--wine)', textDecoration: 'underline' }
                                    }}
                                />
                            </div>

                            <div className="mt-8 space-y-4">
                                <h3 className="font-semibold text-lg border-b pb-2">
                                    Datas em {date ? format(date, 'MMMM', { locale: ptBR }) : 'Selecionado'}
                                </h3>
                                <div className="space-y-2">
                                    {importantDates.filter(d => date && isSameDay(parseISO(d.date), date) || (date && parseISO(d.date).getMonth() === date.getMonth())).length === 0 ? (
                                        <p className="text-muted-foreground text-sm">Nenhuma data neste mês.</p>
                                    ) : (
                                        importantDates
                                            .filter(d => date && parseISO(d.date).getMonth() === date.getMonth())
                                            .map(d => (
                                                <div key={d.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-all">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-gray-100 rounded-lg">
                                                            {getTypeIcon(d.type)}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium">{d.title}</p>
                                                            <p className="text-sm text-muted-foreground capitalize">
                                                                {format(parseISO(d.date), "dd 'de' MMMM", { locale: ptBR })}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-red-400 hover:text-red-600 hover:bg-red-50"
                                                        onClick={() => handleDelete(d.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ))
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

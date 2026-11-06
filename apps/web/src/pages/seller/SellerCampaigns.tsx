
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@theadoro/ui';
import { Button } from '@theadoro/ui';
import { Badge } from '@theadoro/ui';
import { Megaphone, Calendar, Percent, CheckCircle2, ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabaseLoose } from '@/integrations/supabase/loose';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface Campaign {
    id: string;
    title: string;
    description: string;
    discount_percentage: number;
    starts_at: string;
    ends_at: string;
    free_shipping_enabled?: boolean;
    free_shipping_threshold?: number | null;
    is_joined?: boolean;
}

export default function SellerCampaigns() {
    const { user } = useAuth();
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) loadCampaigns();
    }, [user]);

    const loadCampaigns = async () => {
        try {
            setLoading(true);
            // Get all active campaigns
            const { data: allCampaigns } = await supabaseLoose
                .from('campaigns')
                .select('*')
                .eq('is_active', true)
                .order('starts_at', { ascending: true });

            // Get user participation
            const { data: participation } = await supabaseLoose
                .from('campaign_participants')
                .select('campaign_id')
                .eq('seller_id', user!.id);

            const joinedIds = new Set(participation?.map(p => p.campaign_id));

            setCampaigns(allCampaigns?.map(c => ({
                ...c,
                is_joined: joinedIds.has(c.id)
            })) || []);
        } catch (error) {
            console.error('Error loading campaigns:', error);
            toast.error('Erro ao carregar campanhas.');
        } finally {
            setLoading(false);
        }
    };

    const handleJoin = async (campaignId: string) => {
        try {
            const { error } = await supabaseLoose
                .from('campaign_participants')
                .insert({
                    campaign_id: campaignId,
                    seller_id: user!.id
                });

            if (error) throw error;
            toast.success('Você aderiu à campanha com sucesso!');
            loadCampaigns();
        } catch (error) {
            toast.error('Erro ao aderir à campanha.');
        }
    };

    return (
        <div className="space-y-6 pb-10">
            <div>
                <h1 className="text-3xl font-bold">Campanhas THEADORO</h1>
                <p className="text-muted-foreground text-sm">Participe de campanhas oficiais para destacar seus produtos e vender mais.</p>
            </div>

            {loading ? (
                <div className="text-center py-12 text-gray-500">Buscando campanhas disponíveis...</div>
            ) : campaigns.length === 0 ? (
                <Card className="p-12 text-center border-dashed">
                    <Megaphone className="h-12 w-12 text-gray-200 mx-auto mb-4" />
                    <p className="text-gray-500">Nenhuma campanha ativa no momento.</p>
                </Card>
            ) : (
                <div className="grid gap-6">
                    {campaigns.map(campaign => (
                        <Card key={campaign.id} className={cn(
                            "overflow-hidden transition-all",
                            campaign.is_joined ? "border-green-200 bg-green-50/30" : "hover:border-wine/30"
                        )}>
                            <div className="flex flex-col md:flex-row">
                                <div className={cn(
                                    "p-8 flex flex-col items-center justify-center text-white min-w-[200px]",
                                    campaign.is_joined ? "bg-green-600" : "bg-wine"
                                )}>
                                    <Percent className="h-10 w-10 mb-2" />
                                    <span className="text-3xl font-black">{campaign.discount_percentage}%</span>
                                    <span className="text-[10px] uppercase font-bold tracking-widest">de desconto</span>
                                </div>
                                <CardContent className="p-6 flex-1">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="text-xl font-bold text-gray-900">{campaign.title}</h3>
                                                {campaign.is_joined && (
                                                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none">
                                                        <CheckCircle2 className="h-3 w-3 mr-1" /> Inscrito
                                                    </Badge>
                                                )}
                                                {campaign.free_shipping_enabled && (
                                                    <Badge variant="outline" className="border-wine/20 text-wine">
                                                        Frete gratis acima de R$ {Number(campaign.free_shipping_threshold || 0).toFixed(2)}
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-600">{campaign.description}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex flex-wrap gap-4 text-xs text-gray-500 mb-6">
                                        <div className="flex items-center gap-1.5">
                                            <Calendar className="h-4 w-4 text-gray-400" />
                                            <span>Início: {format(new Date(campaign.starts_at), "dd 'de' MMMM", { locale: ptBR })}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Calendar className="h-4 w-4 text-gray-400" />
                                            <span>Término: {format(new Date(campaign.ends_at), "dd 'de' MMMM", { locale: ptBR })}</span>
                                        </div>
                                    </div>

                                    {!campaign.is_joined ? (
                                        <Button onClick={() => handleJoin(campaign.id)} className="bg-wine hover:bg-wine-dark w-full md:w-auto px-8 rounded-xl font-bold">
                                            Aderir à Campanha <ArrowRight className="ml-2 h-4 w-4" />
                                        </Button>
                                    ) : (
                                        <div className="text-sm text-green-700 font-medium flex items-center gap-2 bg-green-100/50 p-3 rounded-lg w-full md:w-fit">
                                            <CheckCircle2 className="h-4 w-4" />
                                            Sua loja já está participando desta campanha!
                                        </div>
                                    )}
                                </CardContent>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}

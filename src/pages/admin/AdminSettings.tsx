import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useSiteSettings, SiteSetting } from '@/hooks/useSiteSettings';
import { Loader2, Settings } from 'lucide-react';
import { toast } from 'sonner';

const AdminSettings = () => {
    const { settings, loading, updateSetting } = useSiteSettings('general');
    const [maintenanceMode, setMaintenanceMode] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [settingId, setSettingId] = useState<string | null>(null);

    useEffect(() => {
        if (settings.length > 0) {
            const maintenanceSetting = settings.find(s => s.key === 'maintenance_mode');
            if (maintenanceSetting) {
                setMaintenanceMode(Boolean(maintenanceSetting.value));
                setSettingId(maintenanceSetting.id);
            }
        }
    }, [settings]);

    const handleToggleMaintenance = async (checked: boolean) => {
        if (!settingId) return;

        try {
            setUpdating(true);
            await updateSetting(settingId, checked);
            setMaintenanceMode(checked);
            toast.success(`Modo Manutenção ${checked ? 'ativado' : 'desativado'}`);
        } catch (error) {
            console.error(error);
            // Revert state on error
            setMaintenanceMode(!checked);
        } finally {
            setUpdating(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Configurações Gerais</h1>
                    <p className="text-muted-foreground">
                        Definições globais do sistema
                    </p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        Sistema
                    </CardTitle>
                    <CardDescription>Controle de acesso e visibilidade do site</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between space-x-2 border p-4 rounded-lg bg-muted/20">
                        <div className="space-y-1">
                            <Label htmlFor="maintenance-mode" className="text-base font-medium">Modo Manutenção</Label>
                            <p className="text-sm text-muted-foreground">
                                Quando ativado, apenas administradores podem acessar o site.
                                Visitantes verão uma tela de "Em breve".
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            {updating && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                            <Switch
                                id="maintenance-mode"
                                checked={maintenanceMode}
                                onCheckedChange={handleToggleMaintenance}
                                disabled={!settingId || updating}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default AdminSettings;

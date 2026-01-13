import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { useSiteSettings, SiteSetting } from '@/hooks/useSiteSettings';
import { Loader2, Settings, Truck, CreditCard, Store } from 'lucide-react';
import { toast } from 'sonner';

const AdminSettings = () => {
    const { settings, loading, updateSetting } = useSiteSettings();
    const [maintenanceMode, setMaintenanceMode] = useState(false);
    const [maintenanceId, setMaintenanceId] = useState<string | null>(null);

    // Store Settings State
    const [storeName, setStoreName] = useState('');
    const [storeNameId, setStoreNameId] = useState<string | null>(null);
    const [storeCep, setStoreCep] = useState('');
    const [storeCepId, setStoreCepId] = useState<string | null>(null);
    const [storeAddress, setStoreAddress] = useState('');
    const [storeAddressId, setStoreAddressId] = useState<string | null>(null);
    const [storeNumber, setStoreNumber] = useState('');
    const [storeNumberId, setStoreNumberId] = useState<string | null>(null);
    const [storeComplement, setStoreComplement] = useState('');
    const [storeComplementId, setStoreComplementId] = useState<string | null>(null);
    const [storeNeighborhood, setStoreNeighborhood] = useState('');
    const [storeNeighborhoodId, setStoreNeighborhoodId] = useState<string | null>(null);
    const [storeCity, setStoreCity] = useState('');
    const [storeCityId, setStoreCityId] = useState<string | null>(null);
    const [storeState, setStoreState] = useState('');
    const [storeStateId, setStoreStateId] = useState<string | null>(null);

    // Integrations State
    const [loggiEnabled, setLoggiEnabled] = useState(false);
    const [loggiEnabledId, setLoggiEnabledId] = useState<string | null>(null);
    const [loggiKey, setLoggiKey] = useState('');
    const [loggiId, setLoggiId] = useState<string | null>(null);

    const [correiosEnabled, setCorreiosEnabled] = useState(false);
    const [correiosId, setCorreiosId] = useState<string | null>(null);

    const [mpPublicKey, setMpPublicKey] = useState('');
    const [mpPublicKeyId, setMpPublicKeyId] = useState<string | null>(null);

    const [mpAccessToken, setMpAccessToken] = useState('');
    const [mpAccessTokenId, setMpAccessTokenId] = useState<string | null>(null);

    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        if (settings.length > 0) {
            // General - System
            const maintenance = settings.find(s => s.key === 'maintenance_mode');
            if (maintenance) {
                setMaintenanceMode(Boolean(maintenance.value));
                setMaintenanceId(maintenance.id);
            }

            // General - Store Address
            const sName = settings.find(s => s.key === 'store_name');
            if (sName) { setStoreName(String(sName.value)); setStoreNameId(sName.id); }

            const sCep = settings.find(s => s.key === 'store_cep');
            if (sCep) { setStoreCep(String(sCep.value)); setStoreCepId(sCep.id); }

            const sAddress = settings.find(s => s.key === 'store_address');
            if (sAddress) { setStoreAddress(String(sAddress.value)); setStoreAddressId(sAddress.id); }

            const sNumber = settings.find(s => s.key === 'store_number');
            if (sNumber) { setStoreNumber(String(sNumber.value)); setStoreNumberId(sNumber.id); }

            const sComplement = settings.find(s => s.key === 'store_complement');
            if (sComplement) { setStoreComplement(String(sComplement.value)); setStoreComplementId(sComplement.id); }

            const sNeighborhood = settings.find(s => s.key === 'store_neighborhood');
            if (sNeighborhood) { setStoreNeighborhood(String(sNeighborhood.value)); setStoreNeighborhoodId(sNeighborhood.id); }

            const sCity = settings.find(s => s.key === 'store_city');
            if (sCity) { setStoreCity(String(sCity.value)); setStoreCityId(sCity.id); }

            const sState = settings.find(s => s.key === 'store_state');
            if (sState) { setStoreState(String(sState.value)); setStoreStateId(sState.id); }


            // Integrations - Shipping
            const loggiEnabledSetting = settings.find(s => s.key === 'shipping_loggi_enabled');
            if (loggiEnabledSetting) {
                setLoggiEnabled(Boolean(loggiEnabledSetting.value));
                setLoggiEnabledId(loggiEnabledSetting.id);
            }

            const loggi = settings.find(s => s.key === 'shipping_loggi_key');
            if (loggi) {
                setLoggiKey(String(loggi.value));
                setLoggiId(loggi.id);
            }

            const correios = settings.find(s => s.key === 'shipping_correios_enabled');
            if (correios) {
                setCorreiosEnabled(Boolean(correios.value));
                setCorreiosId(correios.id);
            }

            // Integrations - Payments
            const mpPublic = settings.find(s => s.key === 'payment_mercadopago_public_key');
            if (mpPublic) {
                setMpPublicKey(String(mpPublic.value));
                setMpPublicKeyId(mpPublic.id);
            }

            const mpAccess = settings.find(s => s.key === 'payment_mercadopago_access_token');
            if (mpAccess) {
                setMpAccessToken(String(mpAccess.value));
                setMpAccessTokenId(mpAccess.id);
            }
        }
    }, [settings]);

    const handleToggleMaintenance = async (checked: boolean) => {
        if (!maintenanceId) return;
        try {
            setUpdating(true);
            await updateSetting(maintenanceId, checked);
            setMaintenanceMode(checked);
        } catch (error) {
            console.error(error);
            setMaintenanceMode(!checked);
        } finally {
            setUpdating(false);
        }
    };

    const [searchingCep, setSearchingCep] = useState(false);

    const handleCepBlur = async () => {
        const cep = storeCep.replace(/\D/g, '');
        if (cep.length !== 8) return;

        setSearchingCep(true);
        try {
            // Try ViaCEP first
            const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
            if (!response.ok) throw new Error('ViaCEP error');
            const data = await response.json();

            if (!data.erro) {
                setStoreAddress(data.logradouro);
                setStoreNeighborhood(data.bairro);
                setStoreCity(data.localidade);
                setStoreState(data.uf);
                toast.success('Endereço carregado via ViaCEP!');
                return;
            }
            throw new Error('CEP not found in ViaCEP');
        } catch (error) {
            console.log('ViaCEP failed, trying BrasilAPI...', error);
            try {
                // Fallback to BrasilAPI
                const response = await fetch(`https://brasilapi.com.br/api/cep/v1/${cep}`);
                if (!response.ok) throw new Error('BrasilAPI error');
                const data = await response.json();

                setStoreAddress(data.street);
                setStoreNeighborhood(data.neighborhood);
                setStoreCity(data.city);
                setStoreState(data.state);
                toast.success('Endereço carregado via BrasilAPI!');
            } catch (fallbackError) {
                console.error('All CEP services failed:', fallbackError);
                toast.error('CEP não encontrado em nenhuma base de dados.');
            }
        } finally {
            setSearchingCep(false);
        }
    };

    const handleSaveStoreSettings = async () => {
        try {
            setUpdating(true);
            const promises = [];
            if (storeNameId) promises.push(updateSetting(storeNameId, storeName, { showToast: false }));
            if (storeCepId) promises.push(updateSetting(storeCepId, storeCep, { showToast: false }));
            if (storeAddressId) promises.push(updateSetting(storeAddressId, storeAddress, { showToast: false }));
            if (storeNumberId) promises.push(updateSetting(storeNumberId, storeNumber, { showToast: false }));
            if (storeComplementId) promises.push(updateSetting(storeComplementId, storeComplement, { showToast: false }));
            if (storeNeighborhoodId) promises.push(updateSetting(storeNeighborhoodId, storeNeighborhood, { showToast: false }));
            if (storeCityId) promises.push(updateSetting(storeCityId, storeCity, { showToast: false }));
            if (storeStateId) promises.push(updateSetting(storeStateId, storeState, { showToast: false }));

            await Promise.all(promises);
            toast.success('Endereço da loja atualizado!');
        } catch (error) {
            console.error(error);
            toast.error('Erro ao atualizar endereço');
        } finally {
            setUpdating(false);
        }
    };

    const handleSaveIntegration = async (id: string | null, value: any, key: string, label: string, section: string = 'integrations') => {
        // In a real scenario, we might need to create the setting if it doesn't exist.
        // For now, assuming we might need to handle creation or just update if exists.
        // Verify if ID exists, if not, we would need a 'createSetting' function which is not in the hook yet.
        // For this interaction let's assume we only update existing ones or user manually inserts SQL.
        // BUT to be user friendly, let's just show a toast if ID is missing saying "Setting not initialized in DB"

        if (!id) {
            toast.error(`Configuração '${key}' não encontrada no banco de dados. Contate o suporte.`);
            return;
        }

        try {
            setUpdating(true);
            await updateSetting(id, value);
            // State is updated via useEffect from hook refetch or optimistic update in hook
        } catch (error) {
            console.error(error);
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
                    <h1 className="text-3xl font-bold">Configurações</h1>
                    <p className="text-muted-foreground">
                        Gerencie as definições globais e integrações
                    </p>
                </div>
            </div>

            <Tabs defaultValue="general" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="general">Geral</TabsTrigger>
                    <TabsTrigger value="integrations">Integrações</TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="space-y-6">
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
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {updating && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                                    <Switch
                                        id="maintenance-mode"
                                        checked={maintenanceMode}
                                        onCheckedChange={handleToggleMaintenance}
                                        disabled={!maintenanceId || updating}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Store className="h-5 w-5" />
                                Endereço da Loja
                            </CardTitle>
                            <CardDescription>Usado como origem para cálculo de frete</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="store-name">Nome da Loja</Label>
                                    <Input id="store-name" value={storeName} onChange={e => setStoreName(e.target.value)} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="store-cep">CEP</Label>
                                        <div className="relative">
                                            <Input
                                                id="store-cep"
                                                value={storeCep}
                                                onChange={e => {
                                                    const val = e.target.value.replace(/\D/g, '').slice(0, 8);
                                                    setStoreCep(val.replace(/(\d{5})(\d)/, '$1-$2'));
                                                }}
                                                onBlur={handleCepBlur}
                                                maxLength={9}
                                                placeholder="00000-000"
                                            />
                                            {searchingCep && (
                                                <div className="absolute right-3 top-2.5">
                                                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="store-state">Estado (UF)</Label>
                                        <Input id="store-state" value={storeState} onChange={e => setStoreState(e.target.value)} maxLength={2} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-[2fr_1fr] gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="store-address">Endereço</Label>
                                        <Input id="store-address" value={storeAddress} onChange={e => setStoreAddress(e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="store-number">Número</Label>
                                        <Input id="store-number" value={storeNumber} onChange={e => setStoreNumber(e.target.value)} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="store-complement">Complemento</Label>
                                        <Input id="store-complement" value={storeComplement} onChange={e => setStoreComplement(e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="store-neighborhood">Bairro</Label>
                                        <Input id="store-neighborhood" value={storeNeighborhood} onChange={e => setStoreNeighborhood(e.target.value)} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="store-city">Cidade</Label>
                                    <Input id="store-city" value={storeCity} onChange={e => setStoreCity(e.target.value)} />
                                </div>
                            </div>
                            <div className="flex justify-end pt-4">
                                <Button onClick={handleSaveStoreSettings} disabled={updating}>
                                    Salvar Endereço
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="integrations" className="space-y-6">
                    {/* Shipping Section */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Truck className="h-5 w-5" />
                                Frete e Envio
                            </CardTitle>
                            <CardDescription>Configure as transportadoras disponíveis</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Loggi */}
                            <div className="space-y-4 border p-4 rounded-lg">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="h-8 w-8 bg-blue-500 rounded flex items-center justify-center text-white font-bold">L</div>
                                        <div>
                                            <Label className="text-base">Loggi</Label>
                                            <p className="text-xs text-muted-foreground">Entrega expressa</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Switch
                                            checked={loggiEnabled}
                                            onCheckedChange={(checked) => {
                                                setLoggiEnabled(checked);
                                                handleSaveIntegration(loggiEnabledId, checked, 'shipping_loggi_enabled', 'Loggi Enabled');
                                            }}
                                            disabled={updating || !loggiEnabledId}
                                        />
                                    </div>
                                </div>

                                {loggiEnabled && (
                                    <div className="pt-4 border-t space-y-4 animate-in fade-in slide-in-from-top-2">
                                        <div className="flex items-end gap-2">
                                            <div className="flex-1 space-y-2">
                                                <Label htmlFor="loggi-key">Chave de API (Produção)</Label>
                                                <Input
                                                    id="loggi-key"
                                                    type="password"
                                                    value={loggiKey}
                                                    onChange={(e) => setLoggiKey(e.target.value)}
                                                    placeholder="Insira sua chave API da Loggi"
                                                />
                                            </div>
                                            <Button
                                                onClick={() => handleSaveIntegration(loggiId, loggiKey, 'shipping_loggi_key', 'Loggi Key')}
                                                disabled={updating || !loggiId}
                                                variant="secondary"
                                            >
                                                Salvar Chave
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Correios */}
                            <div className="flex items-center justify-between border p-4 rounded-lg bg-muted/10">
                                <div className="flex items-center gap-2">
                                    <div className="h-8 w-8 bg-yellow-500 rounded flex items-center justify-center text-white font-bold">C</div>
                                    <div>
                                        <Label className="text-base">Correios</Label>
                                        <p className="text-xs text-muted-foreground">PAC e Sedex (Em breve)</p>
                                    </div>
                                </div>
                                <Switch
                                    checked={correiosEnabled}
                                    onCheckedChange={(checked) => {
                                        setCorreiosEnabled(checked);
                                        handleSaveIntegration(correiosId, checked, 'shipping_correios_enabled', 'Correios');
                                    }}
                                    disabled={updating || !correiosId}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Payments Section */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CreditCard className="h-5 w-5" />
                                Pagamentos
                            </CardTitle>
                            <CardDescription>Gateways e métodos de pagamento</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Mercado Pago */}
                            <div className="space-y-4 border p-4 rounded-lg">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="h-8 w-8 bg-blue-400 rounded flex items-center justify-center text-white font-bold">MP</div>
                                        <div>
                                            <Label className="text-base">Mercado Pago</Label>
                                            <p className="text-xs text-muted-foreground">Cartão, Pix e Boleto</p>
                                        </div>
                                    </div>
                                    <Button
                                        onClick={() => {
                                            handleSaveIntegration(mpPublicKeyId, mpPublicKey, 'payment_mercadopago_public_key', 'MP Public Key');
                                            handleSaveIntegration(mpAccessTokenId, mpAccessToken, 'payment_mercadopago_access_token', 'MP Access Token');
                                        }}
                                        disabled={updating || !mpPublicKeyId}
                                        variant="outline"
                                        size="sm"
                                    >
                                        Salvar Definições
                                    </Button>
                                </div>
                                <div className="grid gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="mp-public">Public Key</Label>
                                        <Input
                                            id="mp-public"
                                            value={mpPublicKey}
                                            onChange={(e) => setMpPublicKey(e.target.value)}
                                            placeholder="APP_USR-..."
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="mp-access">Access Token</Label>
                                        <Input
                                            id="mp-access"
                                            type="password"
                                            value={mpAccessToken}
                                            onChange={(e) => setMpAccessToken(e.target.value)}
                                            placeholder="APP_USR-..."
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default AdminSettings;

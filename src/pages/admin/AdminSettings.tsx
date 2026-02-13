import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
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

    // Integrations - Uber Direct
    const [uberEnabled, setUberEnabled] = useState(false);
    const [uberEnabledId, setUberEnabledId] = useState<string | null>(null);
    const [uberClientId, setUberClientId] = useState('');
    const [uberClientIdId, setUberClientIdId] = useState<string | null>(null);
    const [uberClientSecret, setUberClientSecret] = useState('');
    const [uberClientSecretId, setUberClientSecretId] = useState<string | null>(null);
    const [uberCustomerId, setUberCustomerId] = useState('');
    const [uberCustomerIdId, setUberCustomerIdId] = useState<string | null>(null);
    const [expressTariff, setExpressTariff] = useState('');
    const [expressTariffId, setExpressTariffId] = useState<string | null>(null);

    const [correiosEnabled, setCorreiosEnabled] = useState(false);
    const [correiosId, setCorreiosId] = useState<string | null>(null);

    const [mpEnabled, setMpEnabled] = useState(false);
    const [mpEnabledId, setMpEnabledId] = useState<string | null>(null);

    const [mpPublicKey, setMpPublicKey] = useState('');
    const [mpPublicKeyId, setMpPublicKeyId] = useState<string | null>(null);

    const [mpAccessToken, setMpAccessToken] = useState('');
    const [mpAccessTokenId, setMpAccessTokenId] = useState<string | null>(null);

    // Pagar.me State
    const [pagarmeEnabled, setPagarmeEnabled] = useState(false);
    const [pagarmeEnabledId, setPagarmeEnabledId] = useState<string | null>(null);
    const [pagarmeSecretKey, setPagarmeSecretKey] = useState('');
    const [pagarmeSecretKeyId, setPagarmeSecretKeyId] = useState<string | null>(null);
    const [pagarmeRecipientId, setPagarmeRecipientId] = useState('');
    const [pagarmeRecipientIdId, setPagarmeRecipientIdId] = useState<string | null>(null);

    // Asaas State
    const [asaasEnabled, setAsaasEnabled] = useState(false);
    const [asaasEnabledId, setAsaasEnabledId] = useState<string | null>(null);
    const [asaasApiKey, setAsaasApiKey] = useState('');
    const [asaasApiKeyId, setAsaasApiKeyId] = useState<string | null>(null);
    const [asaasWalletId, setAsaasWalletId] = useState('');
    const [asaasWalletIdId, setAsaasWalletIdId] = useState<string | null>(null);

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


            // Integrations - Shipping - Uber Direct
            const uberEnabledSetting = settings.find(s => s.key === 'shipping_uber_enabled');
            if (uberEnabledSetting) {
                setUberEnabled(Boolean(uberEnabledSetting.value));
                setUberEnabledId(uberEnabledSetting.id);
            }

            const uberClient = settings.find(s => s.key === 'shipping_uber_client_id');
            if (uberClient) {
                setUberClientId(String(uberClient.value));
                setUberClientIdId(uberClient.id);
            }

            const uberSecret = settings.find(s => s.key === 'shipping_uber_client_secret');
            if (uberSecret) {
                setUberClientSecret(String(uberSecret.value));
                setUberClientSecretId(uberSecret.id);
            }

            const uberCustomer = settings.find(s => s.key === 'shipping_uber_customer_id');
            if (uberCustomer) {
                setUberCustomerId(String(uberCustomer.value));
                setUberCustomerIdId(uberCustomer.id);
            }

            const tariff = settings.find(s => s.key === 'shipping_express_tariff');
            if (tariff) {
                setExpressTariff(String(tariff.value));
                setExpressTariffId(tariff.id);
            }

            const correios = settings.find(s => s.key === 'shipping_correios_enabled');
            if (correios) {
                setCorreiosEnabled(Boolean(correios.value));
                setCorreiosId(correios.id);
            }

            // Integrations - Payments
            const mpEnabledSetting = settings.find(s => s.key === 'payment_mercadopago_enabled');
            if (mpEnabledSetting) {
                setMpEnabled(Boolean(mpEnabledSetting.value));
                setMpEnabledId(mpEnabledSetting.id);
            }

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

            // Integrations - Pagar.me
            const pgEnabled = settings.find(s => s.key === 'payment_pagarme_enabled');
            if (pgEnabled) {
                setPagarmeEnabled(Boolean(pgEnabled.value));
                setPagarmeEnabledId(pgEnabled.id);
            }
            const pgKey = settings.find(s => s.key === 'payment_pagarme_secret_key');
            if (pgKey) {
                setPagarmeSecretKey(String(pgKey.value));
                setPagarmeSecretKeyId(pgKey.id);
            }
            const pgRecipient = settings.find(s => s.key === 'payment_pagarme_recipient_id');
            if (pgRecipient) {
                setPagarmeRecipientId(String(pgRecipient.value));
                setPagarmeRecipientIdId(pgRecipient.id);
            }

            // Integrations - Asaas
            const asEnabled = settings.find(s => s.key === 'payment_asaas_enabled');
            if (asEnabled) {
                setAsaasEnabled(Boolean(asEnabled.value));
                setAsaasEnabledId(asEnabled.id);
            }
            const asKey = settings.find(s => s.key === 'payment_asaas_api_key');
            if (asKey) {
                setAsaasApiKey(String(asKey.value));
                setAsaasApiKeyId(asKey.id);
            }
            const asWallet = settings.find(s => s.key === 'payment_asaas_wallet_id');
            if (asWallet) {
                setAsaasWalletId(String(asWallet.value));
                setAsaasWalletIdId(asWallet.id);
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
        try {
            setUpdating(true);
            const newId = await updateSetting(id, value, {
                showToast: true,
                createIfMissing: {
                    key,
                    value,
                    label,
                    section,
                    type: typeof value === 'boolean' ? 'boolean' : 'text'
                }
            });

            // Allow the UI to update with the new ID if one was created
            if (key === 'payment_pagarme_enabled') setPagarmeEnabledId(newId);
            if (key === 'payment_pagarme_secret_key') setPagarmeSecretKeyId(newId);
            if (key === 'payment_pagarme_recipient_id') setPagarmeRecipientIdId(newId);

            if (key === 'payment_asaas_enabled') setAsaasEnabledId(newId);
            if (key === 'payment_asaas_api_key') setAsaasApiKeyId(newId);
            if (key === 'payment_asaas_wallet_id') setAsaasWalletIdId(newId);

            if (key === 'shipping_uber_enabled') setUberEnabledId(newId);
            if (key === 'shipping_uber_client_id') setUberClientIdId(newId);
            if (key === 'shipping_uber_client_secret') setUberClientSecretId(newId);
            if (key === 'shipping_uber_customer_id') setUberCustomerIdId(newId);
            if (key === 'shipping_express_tariff') setExpressTariffId(newId);

            if (key === 'shipping_correios_enabled') setCorreiosId(newId);

            if (key === 'payment_mercadopago_enabled') setMpEnabledId(newId);
            if (key === 'payment_mercadopago_public_key') setMpPublicKeyId(newId);
            if (key === 'payment_mercadopago_access_token') setMpAccessTokenId(newId);

        } catch (error) {
            console.error(error);
        } finally {
            setUpdating(false);
        }
    };

    // URL State for Tabs
    const [searchParams, setSearchParams] = useSearchParams();
    const currentTab = searchParams.get('tab') || 'general';

    const handleTabChange = (value: string) => {
        setSearchParams({ tab: value });
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


            <Tabs value={currentTab} onValueChange={handleTabChange} className="space-y-6">
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
                            {/* Uber Direct */}
                            <div className="space-y-4 border p-4 rounded-lg">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="h-8 w-8 bg-black rounded flex items-center justify-center text-white font-bold">U</div>
                                        <div>
                                            <Label className="text-base">Uber Direct / Express</Label>
                                            <p className="text-xs text-muted-foreground">Entrega Flash (Moto/Carro)</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Switch
                                            checked={uberEnabled}
                                            onCheckedChange={(checked) => {
                                                setUberEnabled(checked);
                                                handleSaveIntegration(uberEnabledId, checked, 'shipping_uber_enabled', 'Uber Enabled');
                                            }}
                                            disabled={updating}
                                        />
                                    </div>
                                </div>

                                {uberEnabled && (
                                    <div className="pt-4 border-t space-y-4 animate-in fade-in slide-in-from-top-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="uber-client-id">Client ID</Label>
                                            <div className="flex gap-2">
                                                <Input
                                                    id="uber-client-id"
                                                    value={uberClientId}
                                                    onChange={(e) => setUberClientId(e.target.value)}
                                                    placeholder="Insira o Client ID do Uber Direct"
                                                />
                                                <Button
                                                    onClick={() => handleSaveIntegration(uberClientIdId, uberClientId, 'shipping_uber_client_id', 'Uber Client ID')}
                                                    disabled={updating}
                                                    variant="secondary"
                                                >
                                                    Salvar
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="uber-client-secret">Client Secret</Label>
                                            <div className="flex gap-2">
                                                <Input
                                                    id="uber-client-secret"
                                                    type="password"
                                                    value={uberClientSecret}
                                                    onChange={(e) => setUberClientSecret(e.target.value)}
                                                    placeholder="Insira o Client Secret"
                                                />
                                                <Button
                                                    onClick={() => handleSaveIntegration(uberClientSecretId, uberClientSecret, 'shipping_uber_client_secret', 'Uber Client Secret')}
                                                    disabled={updating}
                                                    variant="secondary"
                                                >
                                                    Salvar
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="uber-customer-id">Customer ID</Label>
                                            <div className="flex gap-2">
                                                <Input
                                                    id="uber-customer-id"
                                                    value={uberCustomerId}
                                                    onChange={(e) => setUberCustomerId(e.target.value)}
                                                    placeholder="Insira o Customer ID (geralmente um UUID)"
                                                />
                                                <Button
                                                    onClick={() => handleSaveIntegration(uberCustomerIdId, uberCustomerId, 'shipping_uber_customer_id', 'Uber Customer ID')}
                                                    disabled={updating}
                                                    variant="secondary"
                                                >
                                                    Salvar
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="express-tariff">Tarifa Adicional Express (%)</Label>
                                            <div className="flex gap-2">
                                                <Input
                                                    id="express-tariff"
                                                    type="number"
                                                    value={expressTariff}
                                                    onChange={(e) => setExpressTariff(e.target.value)}
                                                    placeholder="Ex: 10 para 10%"
                                                />
                                                <Button
                                                    onClick={() => handleSaveIntegration(expressTariffId, expressTariff, 'shipping_express_tariff', 'Tarifa Express')}
                                                    disabled={updating}
                                                    variant="secondary"
                                                >
                                                    Salvar
                                                </Button>
                                            </div>
                                            <p className="text-xs text-muted-foreground">Porcentagem adicionada ao custo base calculado.</p>
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
                            {/* Pagar.me */}
                            <div className="space-y-4 border p-4 rounded-lg">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="h-8 w-8 bg-green-600 rounded flex items-center justify-center text-white font-bold">PG</div>
                                        <div>
                                            <Label className="text-base">Pagar.me</Label>
                                            <p className="text-xs text-muted-foreground">Cartão (Split) e Pix</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Switch
                                            checked={pagarmeEnabled}
                                            onCheckedChange={(checked) => {
                                                setPagarmeEnabled(checked);
                                                handleSaveIntegration(pagarmeEnabledId, checked, 'payment_pagarme_enabled', 'Pagar.me Enabled');
                                            }}
                                            disabled={updating}
                                        />
                                    </div>
                                </div>
                                {pagarmeEnabled && (
                                    <div className="grid gap-4 pt-4 border-t animate-in fade-in slide-in-from-top-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="pagarme-sk">Secret Key (sk_...)</Label>
                                            <div className="flex gap-2">
                                                <Input
                                                    id="pagarme-sk"
                                                    type="password"
                                                    value={pagarmeSecretKey}
                                                    onChange={(e) => setPagarmeSecretKey(e.target.value)}
                                                    placeholder="sk_test_..."
                                                />
                                                <Button
                                                    onClick={() => handleSaveIntegration(pagarmeSecretKeyId, pagarmeSecretKey, 'payment_pagarme_secret_key', 'Pagar.me Secret Key')}
                                                    disabled={updating}
                                                    variant="secondary"
                                                >
                                                    Salvar
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="pagarme-recipient">Recipient ID (Plataforma)</Label>
                                            <div className="flex gap-2">
                                                <Input
                                                    id="pagarme-recipient"
                                                    value={pagarmeRecipientId}
                                                    onChange={(e) => setPagarmeRecipientId(e.target.value)}
                                                    placeholder="re_..."
                                                />
                                                <Button
                                                    onClick={() => handleSaveIntegration(pagarmeRecipientIdId, pagarmeRecipientId, 'payment_pagarme_recipient_id', 'Pagar.me Recipient ID')}
                                                    disabled={updating}
                                                    variant="secondary"
                                                >
                                                    Salvar
                                                </Button>
                                            </div>
                                            <p className="text-xs text-muted-foreground">ID do recebedor principal que receberá as taxas da plataforma.</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Asaas */}
                            <div className="space-y-4 border p-4 rounded-lg">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="h-8 w-8 bg-blue-800 rounded flex items-center justify-center text-white font-bold">AS</div>
                                        <div>
                                            <Label className="text-base">Asaas</Label>
                                            <p className="text-xs text-muted-foreground">Boleto (Split) e Pix</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Switch
                                            checked={asaasEnabled}
                                            onCheckedChange={(checked) => {
                                                setAsaasEnabled(checked);
                                                handleSaveIntegration(asaasEnabledId, checked, 'payment_asaas_enabled', 'Asaas Enabled');
                                            }}
                                            disabled={updating}
                                        />
                                    </div>
                                </div>
                                {asaasEnabled && (
                                    <div className="grid gap-4 pt-4 border-t animate-in fade-in slide-in-from-top-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="asaas-key">API Key ($...)</Label>
                                            <div className="flex gap-2">
                                                <Input
                                                    id="asaas-key"
                                                    type="password"
                                                    value={asaasApiKey}
                                                    onChange={(e) => setAsaasApiKey(e.target.value)}
                                                    placeholder="$aact_..."
                                                />
                                                <Button
                                                    onClick={() => handleSaveIntegration(asaasApiKeyId, asaasApiKey, 'payment_asaas_api_key', 'Asaas API Key')}
                                                    disabled={updating}
                                                    variant="secondary"
                                                >
                                                    Salvar
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="asaas-wallet">Wallet ID (Plataforma)</Label>
                                            <div className="flex gap-2">
                                                <Input
                                                    id="asaas-wallet"
                                                    value={asaasWalletId}
                                                    onChange={(e) => setAsaasWalletId(e.target.value)}
                                                    placeholder="Id da carteira..."
                                                />
                                                <Button
                                                    onClick={() => handleSaveIntegration(asaasWalletIdId, asaasWalletId, 'payment_asaas_wallet_id', 'Asaas Wallet ID')}
                                                    disabled={updating}
                                                    variant="secondary"
                                                >
                                                    Salvar
                                                </Button>
                                            </div>
                                            <p className="text-xs text-muted-foreground">ID da carteira principal para onde irão as taxas.</p>
                                        </div>
                                    </div>
                                )}
                            </div>

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
                                    <div className="flex items-center gap-2">
                                        <Switch
                                            checked={mpEnabled}
                                            onCheckedChange={(checked) => {
                                                setMpEnabled(checked);
                                                handleSaveIntegration(mpEnabledId, checked, 'payment_mercadopago_enabled', 'Mercado Pago Enabled');
                                            }}
                                            disabled={updating}
                                        />
                                    </div>
                                </div>
                                {mpEnabled && (
                                    <div className="grid gap-4 pt-4 border-t animate-in fade-in slide-in-from-top-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="mp-public">Public Key</Label>
                                            <div className="flex gap-2">
                                                <Input
                                                    id="mp-public"
                                                    value={mpPublicKey}
                                                    onChange={(e) => setMpPublicKey(e.target.value)}
                                                    placeholder="APP_USR-..."
                                                />
                                                <Button
                                                    onClick={() => handleSaveIntegration(mpPublicKeyId, mpPublicKey, 'payment_mercadopago_public_key', 'MP Public Key')}
                                                    disabled={updating}
                                                    variant="secondary"
                                                >
                                                    Salvar
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="mp-access">Access Token</Label>
                                            <div className="flex gap-2">
                                                <Input
                                                    id="mp-access"
                                                    type="password"
                                                    value={mpAccessToken}
                                                    onChange={(e) => setMpAccessToken(e.target.value)}
                                                    placeholder="APP_USR-..."
                                                />
                                                <Button
                                                    onClick={() => handleSaveIntegration(mpAccessTokenId, mpAccessToken, 'payment_mercadopago_access_token', 'MP Access Token')}
                                                    disabled={updating}
                                                    variant="secondary"
                                                >
                                                    Salvar
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div >
    );
};

export default AdminSettings;

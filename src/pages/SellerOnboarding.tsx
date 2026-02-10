import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
    Building2,
    User,
    Store,
    Camera,
    ChevronRight,
    ChevronLeft,
    CheckCircle2,
    Upload,
    AlertCircle,
    Check
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';

const renderMarkdown = (text: string) => {
    if (!text) return '';
    // Clean potential extra quotes from storage
    let cleanText = text;
    if (cleanText.startsWith('"') && cleanText.endsWith('"')) {
        cleanText = cleanText.slice(1, -1);
    }
    // Handle literal \n from manual input escaping
    cleanText = cleanText.replace(/\\n/g, '\n');

    return cleanText
        .replace(/^### (.*$)/gim, '<h3 class="text-lg font-bold mt-4 mb-2">$1</h3>')
        .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold mt-6 mb-3">$1</h2>')
        .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-8 mb-4">$1</h1>')
        .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
        .replace(/\*(.*)\*/gim, '<em>$1</em>')
        .replace(/^- (.*$)/gim, '<li class="ml-4 list-disc">$1</li>')
        .replace(/\n/g, '<br/>');
};

type Step = 'branding' | 'entity' | 'details' | 'documents' | 'plans' | 'legal' | 'success';

interface Plan {
    id: string;
    name: string;
    description: string;
    price: number;
    features: string[];
    limits: any;
}

export default function SellerOnboarding() {
    const { user, profile, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState<Step>('branding');
    const [categoryListLoading, setCategoryListLoading] = useState(false);
    const [categories, setCategories] = useState<any[]>([]);
    const [plans, setPlans] = useState<Plan[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { getSettingValue, loading: settingsLoading } = useSiteSettings('juridico');

    // Legal Step State
    const [hasReadTerms, setHasReadTerms] = useState(false);
    const [hasReadPrivacy, setHasReadPrivacy] = useState(false);
    const [acceptedLegal, setAcceptedLegal] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        storeName: '',
        categoryId: '',
        customCategory: '',
        type: 'pf' as 'pf' | 'pj',
        fullName: '',
        cpf: '',
        companyName: '',
        tradingName: '',
        cnpj: '',
        phone: '',
        postalCode: '',
        street: '',
        number: '',
        complement: '',
        neighborhood: '',
        city: '',
        state: '',
        planId: '',
    });

    // Files State
    const [files, setFiles] = useState<{
        idFront?: File;
        idBack?: File;
        selfie?: File;
        cnpjDoc?: File;
    }>({});

    useEffect(() => {
        if (!authLoading && !user) {
            navigate('/auth', { state: { from: { pathname: '/seller/onboarding' } } });
            return;
        }

        if (user) {
            loadData();
        }
    }, [user, authLoading, navigate]);

    const loadData = async () => {
        const { data: catData }: any = await (supabase.from('categories') as any).select('*').eq('is_active', true);
        setCategories(catData || []);

        const { data: planData, error: planError } = await (supabase.from as any)('subscription_plans').select('*').eq('is_active', true).order('price', { ascending: true });

        if (planError) {
            console.error('Error fetching plans:', planError);
            // Fallback plans if table doesn't exist yet or fails
            setPlans([
                {
                    id: 'start-fallback',
                    name: 'Start',
                    description: 'Para quem está começando',
                    price: 29.90,
                    features: ['Até 15 produtos', 'Taxa de 12%', 'Suporte básico'],
                    limits: {}
                },
                {
                    id: 'scale-fallback',
                    name: 'Scale',
                    description: 'Crescimento acelerado',
                    price: 79.90,
                    features: ['Até 100 produtos', 'Taxa de 9%', 'Relatórios'],
                    limits: {}
                },
                {
                    id: 'pro-fallback',
                    name: 'TheAdoro Pro',
                    description: 'Poder máximo com IA',
                    price: 149.90,
                    features: ['Ilimitado', 'Taxa de 6%', 'IA inclusa'],
                    limits: {}
                }
            ]);
        } else {
            // Parse features if they come as string JSON from DB (Supabase sometimes returns JSONB as object, sometimes need parsing depending on client setup)
            const parsedPlans = planData.map((p: any) => ({
                ...p,
                features: typeof p.features === 'string' ? JSON.parse(p.features) : p.features
            }));
            setPlans(parsedPlans || []);
        }
    };

    const handleNext = () => {
        if (currentStep === 'branding') setCurrentStep('entity');
        else if (currentStep === 'entity') setCurrentStep('details');
        else if (currentStep === 'details') setCurrentStep('documents');
        else if (currentStep === 'documents') setCurrentStep('plans');
        else if (currentStep === 'plans') setCurrentStep('legal');
    };

    const handleBack = () => {
        if (currentStep === 'entity') setCurrentStep('branding');
        else if (currentStep === 'details') setCurrentStep('entity');
        else if (currentStep === 'documents') setCurrentStep('details');
        else if (currentStep === 'plans') setCurrentStep('documents');
        else if (currentStep === 'legal') setCurrentStep('plans');
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, key: keyof typeof files) => {
        const file = e.target.files?.[0];
        if (file) {
            setFiles(prev => ({ ...prev, [key]: file }));
        }
    };

    const uploadFile = async (file: File, path: string) => {
        console.log(`Starting upload for ${path}`, file);
        try {
            const { error, data } = await supabase.storage.from('seller-docs').upload(path, file);
            if (error) {
                console.error(`Upload error for ${path}:`, error);
                throw error;
            }
            console.log(`Upload success for ${path}`, data);

            const { data: { publicUrl } } = supabase.storage.from('seller-docs').getPublicUrl(path);
            console.log(`Public URL for ${path}:`, publicUrl);
            return publicUrl;
        } catch (err) {
            console.error(`Unexpected error in uploadFile for ${path}:`, err);
            throw err;
        }
    };

    const [addressLoading, setAddressLoading] = useState(false);

    const handleCepBlur = async (e: React.ChangeEvent<HTMLInputElement> | any) => {
        const cep = e.target.value.replace(/\D/g, '');

        if (cep.length !== 8) {
            return;
        }

        if (addressLoading) return;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        try {
            setAddressLoading(true);
            const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`, {
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            const data = await response.json();

            if (data.erro) {
                toast.error('CEP não encontrado.');
                return;
            }

            setFormData(prev => ({
                ...prev,
                street: data.logradouro || '',
                neighborhood: data.bairro || '',
                city: data.localidade || '',
                state: data.uf || '',
                complement: data.complemento || prev.complement,
            }));

            toast.success('Endereço encontrado!');
        } catch (error: any) {
            if (error.name === 'AbortError') {
                toast.error('Tempo limite excedido ao buscar CEP.');
            } else {
                console.error('Error fetching CEP:', error);
                toast.error('Erro ao buscar endereço. Preencha manualmente.');
            }
        } finally {
            setAddressLoading(false);
        }
    };

    const handleSubmit = async () => {
        console.log("handleSubmit called");
        try {
            setIsSubmitting(true);

            let userIp = 'Unknown';
            try {
                const ipRes = await fetch('https://api64.ipify.org?format=json');
                const ipData = await ipRes.json();
                userIp = ipData.ip;
            } catch (e) {
                console.warn("Failed to catch IP, proceeding anyway", e);
            }

            const fileUrls: any = {};

            if (files.idFront) {
                fileUrls.idFront = await uploadFile(files.idFront, `${user?.id}/id_front_${Date.now()}`);
            }
            if (files.idBack) {
                fileUrls.idBack = await uploadFile(files.idBack, `${user?.id}/id_back_${Date.now()}`);
            }
            if (files.selfie) {
                fileUrls.selfie = await uploadFile(files.selfie, `${user?.id}/selfie_${Date.now()}`);
            }
            if (files.cnpjDoc) {
                fileUrls.cnpjDoc = await uploadFile(files.cnpjDoc, `${user?.id}/cnpj_${Date.now()}`);
            }

            const payload = {
                user_id: user?.id,
                store_name: formData.storeName,
                primary_category_id: formData.categoryId || null,
                custom_category_suggestion: formData.customCategory,
                type: formData.type,
                full_name: formData.fullName,
                cpf: formData.cpf,
                company_name: formData.companyName,
                trading_name: formData.tradingName,
                cnpj: formData.cnpj,
                phone: formData.phone,
                postal_code: formData.postalCode,
                address: formData.street,
                address_number: formData.number,
                address_complement: formData.complement,
                neighborhood: formData.neighborhood,
                city: formData.city,
                state: formData.state,
                id_front_url: fileUrls.idFront,
                id_back_url: fileUrls.idBack,
                selfie_url: fileUrls.selfie,
                cnpj_doc_url: fileUrls.cnpjDoc,
                status: 'pending',
                accepted_terms: true,
                accepted_legal_at: new Date().toISOString(),
                accepted_legal_ip: userIp,
                chosen_plan_id: formData.planId || null // Save the chosen plan
            };

            const { error, data: insertData } = await (supabase.from as any)('seller_applications').insert(payload);

            if (error) {
                console.error("DB Insert Error:", error);
                throw error;
            }

            setCurrentStep('success');
            toast.success('Solicitação enviada com sucesso!');
        } catch (error: any) {
            console.error('Error submitting application:', error);
            toast.error('Erro ao enviar solicitação: ' + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F8F9FA] pb-20">
            <div className="container max-w-4xl mx-auto px-4 pt-12">

                {/* Progress Header */}
                {currentStep !== 'success' && (
                    <div className="mb-8">
                        <div className="flex justify-between items-center mb-4">
                            <h1 className="text-2xl font-bold text-gray-900">Seja um Vendedor THEADORO</h1>
                            <span className="text-sm font-medium text-muted-foreground">
                                {currentStep === 'branding' ? 'Passo 1 de 6' :
                                    currentStep === 'entity' ? 'Passo 2 de 6' :
                                        currentStep === 'details' ? 'Passo 3 de 6' :
                                            currentStep === 'documents' ? 'Passo 4 de 6' :
                                                currentStep === 'plans' ? 'Passo 5 de 6' : 'Passo 6 de 6'}
                            </span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-wine transition-all duration-500"
                                style={{
                                    width: currentStep === 'branding' ? '16%' :
                                        currentStep === 'entity' ? '32%' :
                                            currentStep === 'details' ? '48%' :
                                                currentStep === 'documents' ? '64%' :
                                                    currentStep === 'plans' ? '80%' : '100%'
                                }}
                            />
                        </div>
                    </div>
                )}

                {/* Step: Branding */}
                {currentStep === 'branding' && (
                    <Card className="border-none shadow-sm max-w-2xl mx-auto">
                        <CardHeader>
                            <div className="w-12 h-12 bg-wine/10 rounded-xl flex items-center justify-center mb-4">
                                <Store className="h-6 w-6 text-wine" />
                            </div>
                            <CardTitle>Identificação da Loja</CardTitle>
                            <CardDescription>Conte-nos como os clientes verão sua marca no site.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="storeName">Nome da Loja (Nome Fantasia)</Label>
                                <Input
                                    id="storeName"
                                    placeholder="Ex: Joalheria do Sol"
                                    value={formData.storeName}
                                    onChange={e => setFormData({ ...formData, storeName: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>O que você pretende vender?</Label>
                                <Select
                                    value={formData.categoryId}
                                    onValueChange={val => setFormData({ ...formData, categoryId: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione uma categoria principal" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map(cat => (
                                            <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                        ))}
                                        <SelectItem value="other">Outra categoria (Sugerir)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            {formData.categoryId === 'other' && (
                                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                    <Label htmlFor="customCategory">Qual categoria você sugere?</Label>
                                    <Input
                                        id="customCategory"
                                        placeholder="Digite o ramo de atuação"
                                        value={formData.customCategory}
                                        onChange={e => setFormData({ ...formData, customCategory: e.target.value })}
                                    />
                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                        <AlertCircle className="h-3 w-3" />
                                        Nossa equipe avaliará a criação desta categoria.
                                    </p>
                                </div>
                            )}
                            <Button
                                className="w-full h-12 bg-wine hover:bg-wine-dark"
                                disabled={!formData.storeName || !formData.categoryId}
                                onClick={handleNext}
                            >
                                Continuar <ChevronRight className="ml-2 h-4 w-4" />
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* Step: Entity Selection */}
                {currentStep === 'entity' && (
                    <Card className="border-none shadow-sm max-w-2xl mx-auto">
                        <CardHeader>
                            <CardTitle>Tipo de Cadastro</CardTitle>
                            <CardDescription>Escolha como você deseja operar fiscalmente.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <RadioGroup
                                value={formData.type}
                                onValueChange={(val: any) => setFormData({ ...formData, type: val })}
                                className="grid grid-cols-1 gap-4"
                            >
                                <Label
                                    className={cn(
                                        "flex items-center gap-4 p-6 border-2 rounded-xl cursor-pointer transition-all",
                                        formData.type === 'pf' ? "border-wine bg-wine/5" : "border-gray-100 hover:border-gray-200"
                                    )}
                                >
                                    <RadioGroupItem value="pf" className="sr-only" />
                                    <div className={cn(
                                        "w-12 h-12 rounded-full flex items-center justify-center",
                                        formData.type === 'pf' ? "bg-wine text-white" : "bg-gray-100 text-gray-500"
                                    )}>
                                        <User className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold">Pessoa Física (CPF)</h3>
                                        <p className="text-sm text-muted-foreground">Sou artesão ou vendedor autônomo.</p>
                                    </div>
                                </Label>

                                <Label
                                    className={cn(
                                        "flex items-center gap-4 p-6 border-2 rounded-xl cursor-pointer transition-all",
                                        formData.type === 'pj' ? "border-wine bg-wine/5" : "border-gray-100 hover:border-gray-200"
                                    )}
                                >
                                    <RadioGroupItem value="pj" className="sr-only" />
                                    <div className={cn(
                                        "w-12 h-12 rounded-full flex items-center justify-center",
                                        formData.type === 'pj' ? "bg-wine text-white" : "bg-gray-100 text-gray-500"
                                    )}>
                                        <Building2 className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold">Pessoa Jurídica (CNPJ)</h3>
                                        <p className="text-sm text-muted-foreground">Sou uma empresa ou MEI.</p>
                                    </div>
                                </Label>
                            </RadioGroup>

                            <div className="flex gap-4">
                                <Button variant="outline" className="flex-1 h-12" onClick={handleBack}>
                                    <ChevronLeft className="mr-2 h-4 w-4" /> Voltar
                                </Button>
                                <Button className="flex-[2] h-12 bg-wine hover:bg-wine-dark" onClick={handleNext}>
                                    Continuar <ChevronRight className="ml-2 h-4 w-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Step: Details */}
                {currentStep === 'details' && (
                    <Card className="border-none shadow-sm max-w-2xl mx-auto">
                        <CardHeader>
                            <CardTitle>Dados do Vendedor</CardTitle>
                            <CardDescription>Informe seus dados {formData.type === 'pf' ? 'de identificação' : 'da empresa'}.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {formData.type === 'pf' ? (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Nome Completo (Conforme RG/CNH)</Label>
                                        <Input value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>CPF</Label>
                                        <Input placeholder="000.000.000-00" value={formData.cpf} onChange={e => setFormData({ ...formData, cpf: e.target.value })} />
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Razão Social</Label>
                                        <Input value={formData.companyName} onChange={e => setFormData({ ...formData, companyName: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>CNPJ</Label>
                                        <Input placeholder="00.000.000/0000-00" value={formData.cnpj} onChange={e => setFormData({ ...formData, cnpj: e.target.value })} />
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label>WhatsApp / Telefone</Label>
                                <Input placeholder="(00) 00000-0000" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                            </div>

                            <div className="space-y-2 pt-4 border-t">
                                <Label className="text-base font-bold">Endereço de Coleta (Sede)</Label>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>CEP</Label>
                                        <div className="relative">
                                            <Input
                                                value={formData.postalCode}
                                                onChange={e => {
                                                    const val = e.target.value.replace(/\D/g, '').slice(0, 8);
                                                    setFormData(prev => ({ ...prev, postalCode: val }));
                                                    if (val.length === 8) {
                                                        const event = { target: { value: val } } as any;
                                                        handleCepBlur(event);
                                                    }
                                                }}
                                                onBlur={handleCepBlur}
                                                maxLength={8}
                                                placeholder="00000000"
                                                disabled={addressLoading}
                                            />
                                            {addressLoading && (
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 border-2 border-wine border-t-transparent rounded-full animate-spin" />
                                            )}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Número</Label>
                                        <Input
                                            value={formData.number}
                                            onChange={e => setFormData({ ...formData, number: e.target.value })}
                                            disabled={addressLoading}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Rua/Logradouro</Label>
                                    <Input
                                        value={formData.street}
                                        onChange={e => setFormData({ ...formData, street: e.target.value })}
                                        disabled={addressLoading}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Bairro</Label>
                                        <Input
                                            value={formData.neighborhood}
                                            onChange={e => setFormData({ ...formData, neighborhood: e.target.value })}
                                            disabled={addressLoading}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Complemento</Label>
                                        <Input
                                            value={formData.complement}
                                            onChange={e => setFormData({ ...formData, complement: e.target.value })}
                                            disabled={addressLoading}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Cidade</Label>
                                        <Input
                                            value={formData.city}
                                            onChange={e => setFormData({ ...formData, city: e.target.value })}
                                            disabled={addressLoading}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Estado (UF)</Label>
                                        <Input
                                            value={formData.state}
                                            onChange={e => setFormData({ ...formData, state: e.target.value })}
                                            disabled={addressLoading}
                                            maxLength={2}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <Button variant="outline" className="flex-1 h-12" onClick={handleBack}>
                                    <ChevronLeft className="mr-2 h-4 w-4" /> Voltar
                                </Button>
                                <Button className="flex-[2] h-12 bg-wine hover:bg-wine-dark" onClick={handleNext}>
                                    Continuar <ChevronRight className="ml-2 h-4 w-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Step: Documents */}
                {currentStep === 'documents' && (
                    <Card className="border-none shadow-sm max-w-2xl mx-auto">
                        <CardHeader>
                            <CardTitle>Verificação de Identidade</CardTitle>
                            <CardDescription>Precisamos validar sua identidade para garantir a segurança no THEADORO.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-8">

                            {/* Selfie Area */}
                            <div className="p-6 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50 flex flex-col items-center text-center">
                                <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-4 text-wine">
                                    <Camera className="h-8 w-8" />
                                </div>
                                <h3 className="font-bold">Selfie com Documento</h3>
                                <p className="text-sm text-muted-foreground mb-4">Envie uma foto clara segurando seu RG ou CNH ao lado do rosto.</p>
                                <Input type="file" accept="image/*" className="hidden" id="selfie" onChange={e => handleFileChange(e, 'selfie')} />
                                <Label htmlFor="selfie" className="cursor-pointer">
                                    <Button variant="outline" asChild>
                                        <span>{files.selfie ? files.selfie.name : 'Escolher foto'}</span>
                                    </Button>
                                </Label>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-sm font-medium">
                                <div className="p-4 border rounded-xl hover:bg-gray-50 transition-all cursor-pointer relative">
                                    <Input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => handleFileChange(e, 'idFront')} />
                                    <Upload className="h-4 w-4 mb-2 text-muted-foreground" />
                                    <span>RG/CNH (Frente)</span>
                                    {files.idFront && <p className="text-[10px] text-green-600 line-clamp-1 mt-1">{files.idFront.name}</p>}
                                </div>
                                <div className="p-4 border rounded-xl hover:bg-gray-50 transition-all cursor-pointer relative">
                                    <Input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => handleFileChange(e, 'idBack')} />
                                    <Upload className="h-4 w-4 mb-2 text-muted-foreground" />
                                    <span>RG/CNH (Verso)</span>
                                    {files.idBack && <p className="text-[10px] text-green-600 line-clamp-1 mt-1">{files.idBack.name}</p>}
                                </div>
                            </div>

                            {formData.type === 'pj' && (
                                <div className="p-4 border rounded-xl bg-gray-50 relative">
                                    <Input type="file" accept=".pdf,image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => handleFileChange(e, 'cnpjDoc')} />
                                    <div className="flex items-center gap-3">
                                        <Upload className="h-5 w-5 text-muted-foreground" />
                                        <div>
                                            <p className="font-bold">Comprovante CNPJ</p>
                                            <p className="text-xs text-muted-foreground">Contrato social ou Cartão CNPJ.</p>
                                            {files.cnpjDoc && <p className="text-[10px] text-green-600 line-clamp-1 mt-1">{files.cnpjDoc.name}</p>}
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-4">
                                <Button variant="outline" className="flex-1 h-12" onClick={handleBack}>
                                    <ChevronLeft className="mr-2 h-4 w-4" /> Voltar
                                </Button>
                                <Button
                                    className="flex-[2] h-12 bg-wine hover:bg-wine-dark"
                                    disabled={!files.selfie || !files.idFront || isSubmitting}
                                    onClick={handleNext}
                                >
                                    Continuar <ChevronRight className="ml-2 h-4 w-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Step: Plans */}
                {currentStep === 'plans' && (
                    <div className="space-y-6">
                        <div className="text-center mb-8">
                            <h2 className="text-3xl font-bold mb-2">Escolha o plano ideal para seu negócio</h2>
                            <p className="text-muted-foreground">Selecione um plano para ativar sua loja. Você poderá alterar depois.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {plans.map((plan) => (
                                <Card
                                    key={plan.id}
                                    className={cn(
                                        "relative border-2 transition-all hover:scale-105 duration-300",
                                        formData.planId === plan.id ? "border-wine bg-wine/5 shadow-xl" : "border-gray-100 shadow-sm"
                                    )}
                                >
                                    {plan.name.includes('Scale') && (
                                        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-wine text-white">RECOMENDADO</Badge>
                                    )}
                                    <CardHeader>
                                        <CardTitle className="text-xl">{plan.name}</CardTitle>
                                        <CardDescription>{plan.description}</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="text-center py-4">
                                            <span className="text-4xl font-bold">R$ {Number(plan.price).toFixed(2).replace('.', ',')}</span>
                                            <span className="text-gray-500">/mês</span>
                                        </div>
                                        <ul className="space-y-3">
                                            {plan.features.map((feature, i) => (
                                                <li key={i} className="flex items-start gap-2">
                                                    <Check className="h-5 w-5 text-green-500 shrink-0" />
                                                    <span className="text-sm text-gray-700">{feature}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </CardContent>
                                    <CardFooter>
                                        <Button
                                            className={cn("w-full h-12", formData.planId === plan.id ? "bg-wine hover:bg-wine-dark" : "bg-gray-900 hover:bg-gray-800")}
                                            onClick={() => setFormData({ ...formData, planId: plan.id })}
                                            variant={formData.planId === plan.id ? 'default' : 'secondary'}
                                        >
                                            {formData.planId === plan.id ? 'Selecionado' : 'Selecionar Plano'}
                                        </Button>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>

                        <div className="flex gap-4 max-w-2xl mx-auto pt-8">
                            <Button variant="outline" className="flex-1 h-12" onClick={handleBack}>
                                <ChevronLeft className="mr-2 h-4 w-4" /> Voltar
                            </Button>
                            <Button
                                className="flex-[2] h-12 bg-wine hover:bg-wine-dark"
                                disabled={!formData.planId}
                                onClick={handleNext}
                            >
                                Continuar <ChevronRight className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}

                {/* Step: Legal */}
                {currentStep === 'legal' && (
                    <Card className="border-none shadow-sm max-w-2xl mx-auto">
                        <CardHeader>
                            <CardTitle>Termos e Condições</CardTitle>
                            <CardDescription>Para prosseguir, você deve ler e aceitar nossos termos e políticas.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">

                            {/* Terms of Use */}
                            <div className="space-y-2">
                                <Label className="text-sm font-bold">Termos de Uso</Label>
                                <div
                                    className="h-48 overflow-y-auto p-4 bg-gray-50 rounded-lg border text-sm text-gray-700 prose prose-sm max-w-none"
                                    onScroll={(e) => {
                                        const target = e.currentTarget;
                                        if (target.scrollHeight - target.scrollTop <= target.clientHeight + 10) {
                                            setHasReadTerms(true);
                                        }
                                    }}
                                >
                                    {getSettingValue('terms_of_use') ? (
                                        <div dangerouslySetInnerHTML={{ __html: renderMarkdown(getSettingValue('terms_of_use')) }} />
                                    ) : (
                                        <p className="text-muted-foreground italic">Carregando termos...</p>
                                    )}
                                </div>
                                {!hasReadTerms && <p className="text-[10px] text-wine italic">Role até o final para confirmar a leitura.</p>}
                            </div>

                            {/* Privacy Policy */}
                            <div className="space-y-2">
                                <Label className="text-sm font-bold">Política de Privacidade</Label>
                                <div
                                    className="h-48 overflow-y-auto p-4 bg-gray-50 rounded-lg border text-sm text-gray-700 prose prose-sm max-w-none"
                                    onScroll={(e) => {
                                        const target = e.currentTarget;
                                        if (target.scrollHeight - target.scrollTop <= target.clientHeight + 10) {
                                            setHasReadPrivacy(true);
                                        }
                                    }}
                                >
                                    {getSettingValue('privacy_policy') ? (
                                        <div dangerouslySetInnerHTML={{ __html: renderMarkdown(getSettingValue('privacy_policy')) }} />
                                    ) : (
                                        <p className="text-muted-foreground italic">Carregando política...</p>
                                    )}
                                </div>
                                {!hasReadPrivacy && <p className="text-[10px] text-wine italic">Role até o final para confirmar a leitura.</p>}
                            </div>

                            <div className="flex items-center space-x-2 pt-4">
                                <Checkbox
                                    id="terms"
                                    checked={acceptedLegal}
                                    onCheckedChange={(checked) => setAcceptedLegal(checked === true)}
                                    disabled={!hasReadTerms || !hasReadPrivacy}
                                />
                                <label
                                    htmlFor="terms"
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                    Li e aceito os termos de uso e política de privacidade.
                                </label>
                            </div>

                            <div className="flex gap-4">
                                <Button variant="outline" className="flex-1 h-12" onClick={handleBack}>
                                    <ChevronLeft className="mr-2 h-4 w-4" /> Voltar
                                </Button>
                                <Button
                                    className="flex-[2] h-12 bg-wine hover:bg-wine-dark"
                                    disabled={!acceptedLegal || isSubmitting}
                                    onClick={handleSubmit}
                                >
                                    {isSubmitting ? 'Enviando...' : 'Finalizar Cadastro'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Success Page */}
                {currentStep === 'success' && (
                    <Card className="border-none shadow-sm text-center py-12 max-w-2xl mx-auto">
                        <CardContent className="space-y-6">
                            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle2 className="h-10 w-10" />
                            </div>
                            <h2 className="text-3xl font-bold">Solicitação Enviada!</h2>
                            <p className="text-muted-foreground max-w-sm mx-auto">
                                Parabéns! Sua solicitação para ser um vendedor no **THEADORO** foi recebida com sucesso.
                                Nossa equipe irá revisar seus documentos e você receberá uma resposta em até 2 horas.
                            </p>
                            <div className="pt-8">
                                <Button className="w-full h-12 bg-wine hover:bg-wine-dark" onClick={() => navigate('/buyer/dashboard')}>
                                    Ir para o Painel
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}

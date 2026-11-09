
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@theadoro/ui';
import { Button } from '@theadoro/ui';
import { Input } from '@theadoro/ui';
import { Label } from '@theadoro/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@theadoro/ui';
import { RadioGroup, RadioGroupItem } from '@theadoro/ui';
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
import { Checkbox } from '@theadoro/ui';
import { Badge } from '@theadoro/ui';

const renderMarkdown = (text: string) => {
    if (!text) return '';
    let cleanText = text;
    if (cleanText.startsWith('"') && cleanText.endsWith('"')) {
        cleanText = cleanText.slice(1, -1);
    }
    cleanText = cleanText.replace(/\\n/g, '\n');

    return cleanText
        .replace(/^### (.*$)/gim, '<h3 class="text-lg font-bold mt-4 mb-2">$1</h3>')
        .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold mt-6 mb-3">$2</h2>')
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
    const [categories, setCategories] = useState<any[]>([]);
    const [plans, setPlans] = useState<Plan[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { getSettingValue } = useSiteSettings('juridico');

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

    const [addressLoading, setAddressLoading] = useState(false);

    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            navigate('/auth', { state: { from: { pathname: '/seller/onboarding' } } });
            return;
        }
        if (profile?.role === 'seller') {
            navigate('/seller/dashboard');
            return;
        }
        loadData();
    }, [user, profile, authLoading, navigate]);

    const loadData = async () => {
        const { data: apps } = await (supabase.from as any)('seller_applications')
            .select('*')
            .eq('user_id', user?.id)
            .order('created_at', { ascending: false })
            .limit(1);

        if (apps && apps.length > 0 && apps[0].status === 'pending') {
            setCurrentStep('success');
            return;
        }

        const { data: catData }: any = await (supabase.from('categories') as any).select('*').eq('is_active', true);
        setCategories(catData || []);

        const { data: planData } = await (supabase.from as any)('subscription_plans').select('*').eq('is_active', true).order('price', { ascending: true });
        if (planData) {
            setPlans(planData.map((p: any) => ({
                ...p,
                features: typeof p.features === 'string' ? JSON.parse(p.features) : p.features
            })));
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
        if (file) setFiles(prev => ({ ...prev, [key]: file }));
    };

    const uploadFile = async (file: File, path: string) => {
        const { error } = await supabase.storage.from('seller-docs').upload(path, file);
        if (error) throw error;
        const { data: { publicUrl } } = supabase.storage.from('seller-docs').getPublicUrl(path);
        return publicUrl;
    };

    const handleCepBlur = async (e: any) => {
        const cep = e.target.value.replace(/\D/g, '');
        if (cep.length !== 8 || addressLoading) return;
        try {
            setAddressLoading(true);
            const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
            const data = await response.json();
            if (data.erro) { toast.error('CEP não encontrado.'); return; }
            setFormData(prev => ({
                ...prev,
                street: data.logradouro || '',
                neighborhood: data.bairro || '',
                city: data.localidade || '',
                state: data.uf || '',
            }));
        } catch (error) { toast.error('Erro ao buscar CEP.'); } finally { setAddressLoading(false); }
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            const fileUrls: any = {};
            if (files.idFront) fileUrls.idFront = await uploadFile(files.idFront, `${user?.id}/id_f_${Date.now()}`);
            if (files.idBack) fileUrls.idBack = await uploadFile(files.idBack, `${user?.id}/id_b_${Date.now()}`);
            if (files.selfie) fileUrls.selfie = await uploadFile(files.selfie, `${user?.id}/selfie_${Date.now()}`);
            if (files.cnpjDoc) fileUrls.cnpjDoc = await uploadFile(files.cnpjDoc, `${user?.id}/cnpj_${Date.now()}`);

            const { error } = await (supabase.from as any)('seller_applications').insert({
                user_id: user?.id,
                store_name: formData.storeName,
                primary_category_id: formData.categoryId !== 'other' ? formData.categoryId : null,
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
                chosen_plan_id: formData.planId
            });

            if (error) throw error;
            setCurrentStep('success');
            toast.success('Cadastro finalizado!');
        } catch (error: any) {
            toast.error('Erro ao salvar: ' + error.message);
        } finally { setIsSubmitting(false); }
    };

    return (
        <div className="min-h-screen bg-background pb-20">
            <div className="container max-w-4xl mx-auto px-4 pt-12">
                {currentStep !== 'success' && (
                    <div className="mb-8">
                        <div className="flex justify-between items-center mb-4">
                            <h1 className="text-2xl font-bold text-gray-900">Seja um Vendedor</h1>
                            <span className="text-sm font-medium text-muted-foreground capitalize">{currentStep}</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-wine transition-all duration-500" style={{ width: '80%' }} />
                        </div>
                    </div>
                )}

                {currentStep === 'branding' && (
                    <Card className="max-w-2xl mx-auto border-none shadow-sm">
                        <CardHeader><CardTitle>Identificação da Loja</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2"><Label>Nome da Loja</Label><Input value={formData.storeName} onChange={e => setFormData({...formData, storeName: e.target.value})} /></div>
                            <div className="space-y-2"><Label>Categoria</Label>
                                <Select value={formData.categoryId} onValueChange={v => setFormData({...formData, categoryId: v})}>
                                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                    <SelectContent>{categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}<SelectItem value="other">Outra...</SelectItem></SelectContent>
                                </Select>
                            </div>
                            <Button className="w-full bg-wine" onClick={handleNext} disabled={!formData.storeName}>Próximo</Button>
                        </CardContent>
                    </Card>
                )}

                {currentStep === 'entity' && (
                    <Card className="max-w-2xl mx-auto border-none shadow-sm">
                        <CardHeader><CardTitle>Tipo de Cadastro</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <RadioGroup value={formData.type} onValueChange={(v: any) => setFormData({...formData, type: v})}>
                                <div className="flex items-center space-x-2"><RadioGroupItem value="pf" id="pf"/><Label htmlFor="pf">Pessoa Física</Label></div>
                                <div className="flex items-center space-x-2"><RadioGroupItem value="pj" id="pj"/><Label htmlFor="pj">Pessoa Jurídica</Label></div>
                            </RadioGroup>
                            <div className="flex gap-2"><Button variant="outline" className="flex-1" onClick={handleBack}>Voltar</Button><Button className="flex-1 bg-wine" onClick={handleNext}>Próximo</Button></div>
                        </CardContent>
                    </Card>
                )}

                {currentStep === 'details' && (
                    <Card className="max-w-2xl mx-auto border-none shadow-sm">
                        <CardHeader><CardTitle>Dados do Vendedor</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <Input placeholder="Nome Completo / Razão" value={formData.fullName || formData.companyName} onChange={e => setFormData({...formData, fullName: e.target.value, companyName: e.target.value})} />
                            <Input placeholder="CPF / CNPJ" value={formData.cpf || formData.cnpj} onChange={e => setFormData({...formData, cpf: e.target.value, cnpj: e.target.value})} />
                            <Input placeholder="CEP" value={formData.postalCode} onBlur={handleCepBlur} onChange={e => setFormData({...formData, postalCode: e.target.value})} />
                            <div className="flex gap-2"><Button variant="outline" className="flex-1" onClick={handleBack}>Voltar</Button><Button className="flex-1 bg-wine" onClick={handleNext}>Próximo</Button></div>
                        </CardContent>
                    </Card>
                )}

                {currentStep === 'documents' && (
                    <Card className="max-w-2xl mx-auto border-none shadow-sm">
                        <CardHeader><CardTitle>Documentos</CardTitle></CardHeader>
                        <CardContent className="space-y-4 text-center">
                            <div className="p-8 border-2 border-dashed rounded-xl bg-gray-50">
                                <Label htmlFor="doc-up" className="cursor-pointer">Clique para enviar Selfie com Documento</Label>
                                <Input id="doc-up" type="file" className="hidden" onChange={e => handleFileChange(e, 'selfie')} />
                                {files.selfie && <p className="mt-2 text-green-600 font-bold">✓ {files.selfie.name}</p>}
                            </div>
                            <div className="flex gap-2"><Button variant="outline" className="flex-1" onClick={handleBack}>Voltar</Button><Button className="flex-1 bg-wine" onClick={handleNext} disabled={!files.selfie}>Próximo</Button></div>
                        </CardContent>
                    </Card>
                )}

                {currentStep === 'plans' && (
                    <div className="grid md:grid-cols-3 gap-4">
                        {plans.map(p => (
                            <Card key={p.id} className={cn("cursor-pointer", formData.planId === p.id && "border-wine ring-1 ring-wine")} onClick={() => setFormData({...formData, planId: p.id})}>
                                <CardHeader><CardTitle>{p.name}</CardTitle></CardHeader>
                                <CardContent><p className="text-2xl font-bold">R$ {p.price}</p></CardContent>
                            </Card>
                        ))}
                        <div className="md:col-span-3 flex gap-2"><Button variant="outline" className="flex-1" onClick={handleBack}>Voltar</Button><Button className="flex-1 bg-wine" onClick={handleNext} disabled={!formData.planId}>Próximo</Button></div>
                        <p className="md:col-span-3 text-sm text-muted-foreground text-center">
                            O pagamento da assinatura é feito depois da aprovação do cadastro,
                            em <strong>Minha Assinatura</strong>. Nada é cobrado agora.
                        </p>
                    </div>
                )}

                {currentStep === 'legal' && (
                    <Card className="max-w-2xl mx-auto border-none shadow-sm">
                        <CardHeader><CardTitle>Termos</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center space-x-2"><Checkbox id="t" onCheckedChange={v => setAcceptedLegal(v === true)}/><Label htmlFor="t">Aceito os termos</Label></div>
                            <div className="flex gap-2"><Button variant="outline" className="flex-1" onClick={handleBack}>Voltar</Button><Button className="flex-1 bg-wine" onClick={handleSubmit} disabled={!acceptedLegal || isSubmitting}>Finalizar</Button></div>
                        </CardContent>
                    </Card>
                )}

                {currentStep === 'success' && (
                    <div className="text-center space-y-4 py-20">
                        <CheckCircle2 className="h-20 w-20 text-green-500 mx-auto" />
                        <h2 className="text-3xl font-bold">Cadastro enviado!</h2>
                        <p className="text-muted-foreground max-w-xl mx-auto">
                            Nossa equipe vai analisar seus documentos. Quando o cadastro for aprovado,
                            você recebe uma fatura em <strong>Minha Assinatura</strong>. O plano só é
                            cobrado depois da aprovação.
                        </p>
                        <Button className="bg-wine" onClick={() => navigate('/buyer/dashboard')}>Ir para o Painel</Button>
                    </div>
                )}
            </div>
        </div>
    );
}

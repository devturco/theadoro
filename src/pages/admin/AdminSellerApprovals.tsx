import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
    CheckCircle2,
    XCircle,
    Eye,
    FileText,
    User,
    Building2,
    Calendar,
    Phone,
    MapPin,
    ExternalLink
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { DataTable } from '@/components/ui/data-table';

export default function AdminSellerApprovals() {
    const [applications, setApplications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedApp, setSelectedApp] = useState<any>(null);
    const [mediaPreview, setMediaPreview] = useState<string | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    useEffect(() => {
        loadApplications();
    }, []);

    const loadApplications = async () => {
        try {
            setLoading(true);
            const { data, error }: anyArr = await (supabase.from as any)('seller_applications')
                .select('*, user:profiles(full_name, email), category:categories(name)')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setApplications(data || []);
        } catch (error: any) {
            toast.error('Erro ao carregar solicitações: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (app: any) => {
        try {
            // 1. Update Application Status
            const { error: appError } = await (supabase.from as any)('seller_applications')
                .update({ status: 'approved' })
                .eq('id', app.id);

            if (appError) {
                console.error('Error updating application status:', appError);
                throw new Error('Falha ao atualizar o status da solicitação: ' + appError.message);
            }

            // 2. Update User Role in user_roles table
            const { error: roleError } = await (supabase.from as any)('user_roles')
                .upsert({
                    user_id: app.user_id,
                    role: 'seller'
                }, {
                    onConflict: 'user_id,role'
                });

            if (roleError) {
                console.error('Error updating user role table:', roleError);
                throw new Error('Falha ao atribuir cargo de vendedor: ' + roleError.message);
            }

            // 3. Update Profile with seller role (Legacy Compatibility)
            const { error: profileError } = await (supabase.from as any)('profiles')
                .update({
                    role: 'seller'
                })
                .eq('id', app.user_id);

            if (profileError) {
                console.error('Error updating profile role:', profileError);
                toast.warning('Cargo atribuído na tabela mestre, mas houve um erro ao sincronizar com o perfil legado.');
            }

            toast.success('Vendedor aprovado com sucesso!');
            setIsDetailsOpen(false);
            loadApplications();
        } catch (error: any) {
            toast.error(error.message || 'Erro ao aprovar solicitação');
        }
    };

    const handleReject = async (app: any) => {
        const reason = prompt('Motivo da reprovação:');
        if (!reason) return;

        try {
            const { error } = await (supabase.from as any)('seller_applications')
                .update({
                    status: 'rejected',
                    admin_notes: reason
                })
                .eq('id', app.id);

            if (error) throw error;

            toast.success('Solicitação reprovada.');
            setIsDetailsOpen(false);
            loadApplications();
        } catch (error: any) {
            toast.error('Erro ao reprovar: ' + error.message);
        }
    };

    type anyArr = { data: any[] | null, error: any };

    const columns = [
        {
            key: 'store_name',
            title: 'Nome da Loja',
            render: (val: string, row: any) => (
                <div className="flex flex-col">
                    <span className="font-bold">{val}</span>
                    <span className="text-xs text-muted-foreground">{row.user?.email}</span>
                </div>
            )
        },
        {
            key: 'type',
            title: 'Tipo',
            render: (val: string) => (
                <Badge variant="outline" className="capitalize">
                    {val === 'pf' ? 'Pessoa Física' : 'Pessoa Jurídica'}
                </Badge>
            )
        },
        {
            key: 'status',
            title: 'Status',
            render: (val: string) => (
                <Badge
                    className={cn(
                        "capitalize",
                        val === 'approved' ? "bg-green-100 text-green-700 hover:bg-green-200" :
                            val === 'pending' ? "bg-amber-100 text-amber-700 hover:bg-amber-200" :
                                "bg-red-100 text-red-700 hover:bg-red-200"
                    )}
                >
                    {val === 'approved' ? 'Aprovado' : val === 'pending' ? 'Pendente' : 'Reprovado'}
                </Badge>
            )
        },
        {
            key: 'created_at',
            title: 'Data',
            render: (val: string) => new Date(val).toLocaleDateString('pt-BR')
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Aprovações de Vendedores</h1>
                    <p className="text-muted-foreground">Analise os documentos e aprove novos parceiros.</p>
                </div>
            </div>

            <Card>
                <CardContent className="pt-6">
                    <DataTable
                        data={applications}
                        columns={columns}
                        loading={loading}
                        actions={[
                            {
                                label: 'Ver Detalhes',
                                icon: <Eye className="h-4 w-4" />,
                                onClick: (row) => {
                                    setSelectedApp(row);
                                    setIsDetailsOpen(true);
                                }
                            }
                        ]}
                    />
                </CardContent>
            </Card>

            <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            Detalhes da Solicitação: {selectedApp?.store_name}
                        </DialogTitle>
                        <DialogDescription>
                            Revise os dados abaixo antes de tomar uma decisão.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedApp && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-6">

                            {/* Info Column */}
                            <div className="space-y-6">
                                <section>
                                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">Informações da Loja</h3>
                                    <div className="grid gap-2">
                                        <div className="flex justify-between border-b pb-1 text-sm">
                                            <span className="text-muted-foreground">Nome Fantasia:</span>
                                            <span className="font-medium">{selectedApp.store_name}</span>
                                        </div>
                                        <div className="flex justify-between border-b pb-1 text-sm">
                                            <span className="text-muted-foreground">Categoria:</span>
                                            <span className="font-medium">{selectedApp.category?.name || selectedApp.custom_category_suggestion || 'N/A'}</span>
                                        </div>
                                    </div>
                                </section>

                                <section>
                                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">Dados Legais ({selectedApp.type.toUpperCase()})</h3>
                                    <div className="grid gap-2">
                                        {selectedApp.type === 'pf' ? (
                                            <>
                                                <div className="flex justify-between border-b pb-1 text-sm">
                                                    <span className="text-muted-foreground">Nome:</span>
                                                    <span className="font-medium">{selectedApp.full_name}</span>
                                                </div>
                                                <div className="flex justify-between border-b pb-1 text-sm">
                                                    <span className="text-muted-foreground">CPF:</span>
                                                    <span className="font-medium">{selectedApp.cpf}</span>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="flex justify-between border-b pb-1 text-sm">
                                                    <span className="text-muted-foreground">Razão Social:</span>
                                                    <span className="font-medium">{selectedApp.company_name}</span>
                                                </div>
                                                <div className="flex justify-between border-b pb-1 text-sm">
                                                    <span className="text-muted-foreground">CNPJ:</span>
                                                    <span className="font-medium">{selectedApp.cnpj}</span>
                                                </div>
                                            </>
                                        )}
                                        <div className="flex justify-between border-b pb-1 text-sm">
                                            <span className="text-muted-foreground">Telefone:</span>
                                            <span className="font-medium">{selectedApp.phone}</span>
                                        </div>
                                    </div>
                                </section>

                                <section>
                                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">Endereço de Coleta</h3>
                                    <div className="text-sm bg-gray-50 p-4 rounded-lg">
                                        <p>{selectedApp.address}, {selectedApp.address_number}</p>
                                        <p>{selectedApp.neighborhood}</p>
                                        <p>{selectedApp.city} - {selectedApp.state}</p>
                                        <p>CEP: {selectedApp.postal_code}</p>
                                    </div>
                                </section>

                                <section>
                                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">Aceite Legal</h3>
                                    <div className="text-sm bg-blue-50 p-4 rounded-lg border border-blue-100">
                                        <div className="flex justify-between border-b border-blue-200/50 pb-1 mb-1">
                                            <span className="text-muted-foreground">Termos Aceitos:</span>
                                            <span className="font-bold text-blue-700">{selectedApp.accepted_terms ? 'Sim' : 'Não'}</span>
                                        </div>
                                        <div className="flex justify-between border-b border-blue-200/50 pb-1 mb-1">
                                            <span className="text-muted-foreground">Data/Hora:</span>
                                            <span className="font-medium text-blue-700">
                                                {selectedApp.accepted_legal_at ? new Date(selectedApp.accepted_legal_at).toLocaleString('pt-BR') : 'N/A'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Endereço IP:</span>
                                            <span className="font-mono text-xs text-blue-800 bg-white px-1 rounded">{selectedApp.accepted_legal_ip || 'N/A'}</span>
                                        </div>
                                    </div>
                                </section>
                            </div>

                            {/* Media Column */}
                            <div className="space-y-6">
                                <section>
                                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">Verificação de Identidade</h3>
                                    <div className="grid gap-4">
                                        <div className="space-y-1">
                                            <Label>Selfie com Documento</Label>
                                            {selectedApp.selfie_url ? (
                                                <div
                                                    className="aspect-video rounded-lg overflow-hidden border cursor-pointer hover:opacity-90 transition-opacity"
                                                    onClick={() => setMediaPreview(selectedApp.selfie_url)}
                                                >
                                                    <img src={selectedApp.selfie_url} alt="Selfie" className="w-full h-full object-cover" />
                                                </div>
                                            ) : <p className="text-xs text-red-500">Selfie não enviada</p>}
                                        </div>

                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="space-y-1">
                                                <Label className="text-[10px]">Doc Frente</Label>
                                                <div
                                                    onClick={() => setMediaPreview(selectedApp.id_front_url)}
                                                    className="block aspect-[4/3] rounded border bg-gray-50 group overflow-hidden relative cursor-pointer"
                                                >
                                                    <img src={selectedApp.id_front_url} alt="Doc Frente" className="w-full h-full object-cover" />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                                                        <Eye className="text-white h-5 w-5" />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-[10px]">Doc Verso</Label>
                                                <div
                                                    onClick={() => setMediaPreview(selectedApp.id_back_url)}
                                                    className="block aspect-[4/3] rounded border bg-gray-50 group overflow-hidden relative cursor-pointer"
                                                >
                                                    <img src={selectedApp.id_back_url} alt="Doc Verso" className="w-full h-full object-cover" />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                                                        <Eye className="text-white h-5 w-5" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {selectedApp.type === 'pj' && selectedApp.cnpj_doc_url && (
                                            <Button variant="outline" className="w-full" onClick={() => window.open(selectedApp.cnpj_doc_url, '_blank')}>
                                                <FileText className="h-4 w-4 mr-2" /> Visualizar Documento CNPJ
                                            </Button>
                                        )}
                                    </div>
                                </section>
                            </div>

                        </div>
                    )}

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="destructive" onClick={() => handleReject(selectedApp)} disabled={selectedApp?.status !== 'pending'}>
                            <XCircle className="h-4 w-4 mr-2" /> Reprovar
                        </Button>
                        <div className="flex-1" />
                        <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>Cancelar</Button>
                        <Button className="bg-green-600 hover:bg-green-700" onClick={() => handleApprove(selectedApp)} disabled={selectedApp?.status !== 'pending'}>
                            <CheckCircle2 className="h-4 w-4 mr-2" /> Aprovar Vendedor
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Media Preview Dialog */}
            <Dialog open={!!mediaPreview} onOpenChange={() => setMediaPreview(null)}>
                <DialogContent className="max-w-5xl h-[90vh] bg-black/95 border-none p-0 flex items-center justify-center overflow-hidden">
                    <div className="relative w-full h-full flex items-center justify-center">
                        <Button
                            variant="ghost"
                            className="absolute top-4 right-4 text-white hover:bg-white/20 z-50 rounded-full h-10 w-10 p-0"
                            onClick={() => setMediaPreview(null)}
                        >
                            <XCircle className="h-6 w-6" />
                        </Button>
                        {mediaPreview && (
                            <img
                                src={mediaPreview}
                                alt="Preview"
                                className="max-w-full max-h-full object-contain"
                            />
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// Utility for status colors
function cn(...classes: any[]) {
    return classes.filter(Boolean).join(' ');
}

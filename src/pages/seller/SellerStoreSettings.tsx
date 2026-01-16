import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FileUpload } from '@/components/ui/file-upload';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
    Store,
    Image as ImageIcon,
    User,
    MapPin,
    Save,
    Loader2,
    Camera
} from 'lucide-react';

export default function SellerStoreSettings() {
    const { user, profile, refreshProfile } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        full_name: '',
        bio: '',
        city: '',
        state: '',
        avatar_url: '',
        store_banner_url: ''
    });

    useEffect(() => {
        if (profile) {
            setFormData({
                full_name: profile.full_name || '',
                bio: profile.bio || '',
                city: (profile as any).city || '',
                state: (profile as any).state || '',
                avatar_url: profile.avatar_url || '',
                store_banner_url: (profile as any).store_banner_url || ''
            });
            setLoading(false);
        }
    }, [profile]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setSaving(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    full_name: formData.full_name,
                    bio: formData.bio,
                    city: formData.city,
                    state: formData.state,
                    avatar_url: formData.avatar_url,
                    store_banner_url: formData.store_banner_url,
                    updated_at: new Date().toISOString()
                })
                .eq('id', user.id);

            if (error) throw error;

            toast.success('Configurações da loja atualizadas!');
            refreshProfile();
        } catch (error: any) {
            console.error('Error updating store settings:', error);
            toast.error('Erro ao atualizar configurações: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleAvatarUpload = (urls: string[]) => {
        setFormData(prev => ({ ...prev, avatar_url: urls[0] }));
    };

    const handleBannerUpload = (urls: string[]) => {
        setFormData(prev => ({ ...prev, store_banner_url: urls[0] }));
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-wine" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
            <div>
                <h1 className="text-3xl font-bold font-sans text-gradient-wine flex items-center gap-3">
                    <Store className="h-8 w-8" />
                    Personalizar Minha Loja
                </h1>
                <p className="text-muted-foreground mt-2">
                    Configure a identidade visual e informações da sua loja para encantar seus clientes.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Visual Identity Section */}
                <Card className="border-gray-100 shadow-lg rounded-2xl overflow-hidden">
                    <CardHeader className="bg-gray-50/50 border-b border-gray-100">
                        <CardTitle className="text-xl flex items-center gap-2">
                            <ImageIcon className="h-5 w-5 text-wine" />
                            Identidade Visual
                        </CardTitle>
                        <CardDescription>Banner e foto de perfil da sua loja no marketplace</CardDescription>
                    </CardHeader>
                    <CardContent className="p-8 space-y-8">
                        {/* Banner Upload */}
                        <div className="space-y-4">
                            <Label className="text-sm font-semibold text-gray-700">Banner da Loja</Label>
                            <div className="relative group">
                                <div className="aspect-[21/9] w-full rounded-2xl overflow-hidden bg-gray-100 border-2 border-dashed border-gray-200 flex items-center justify-center transition-all group-hover:border-wine/30">
                                    {formData.store_banner_url ? (
                                        <img
                                            src={formData.store_banner_url}
                                            alt="Banner Preview"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="text-center">
                                            <ImageIcon className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                                            <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Sem Banner</p>
                                        </div>
                                    )}
                                </div>
                                <div className="mt-4">
                                    <FileUpload
                                        onUpload={handleBannerUpload}
                                        options={{ bucket: 'avatars', folder: 'banners' }}
                                        maxFiles={1}
                                        className="w-full"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Avatar Upload */}
                        <div className="flex flex-col md:flex-row gap-8 items-start">
                            <div className="space-y-4 shrink-0">
                                <Label className="text-sm font-semibold text-gray-700">Foto de Perfil</Label>
                                <div className="relative group">
                                    <div className="h-32 w-32 rounded-full overflow-hidden bg-gray-100 border-4 border-white shadow-md flex items-center justify-center transition-all group-hover:border-wine/20">
                                        {formData.avatar_url ? (
                                            <img
                                                src={formData.avatar_url}
                                                alt="Profile Preview"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <User className="h-12 w-12 text-gray-300" />
                                        )}
                                    </div>
                                    <div className="mt-4">
                                        <FileUpload
                                            onUpload={handleAvatarUpload}
                                            options={{ bucket: 'avatars', folder: 'profiles' }}
                                            maxFiles={1}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 space-y-6 pt-2">
                                <div className="grid gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="full_name" className="text-sm font-semibold text-gray-700">Nome da Loja / Profissional</Label>
                                        <Input
                                            id="full_name"
                                            value={formData.full_name}
                                            onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                                            placeholder="Ex: Cerâmicas Delicadas"
                                            className="h-11 rounded-xl"
                                            required
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="bio" className="text-sm font-semibold text-gray-700">Bio / Sobre a Loja</Label>
                                        <Textarea
                                            id="bio"
                                            value={formData.bio}
                                            onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                                            placeholder="Conte um pouco sobre sua arte e história..."
                                            className="rounded-xl resize-none"
                                            rows={4}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Location Section */}
                <Card className="border-gray-100 shadow-lg rounded-2xl overflow-hidden">
                    <CardHeader className="bg-gray-50/50 border-b border-gray-100">
                        <CardTitle className="text-xl flex items-center gap-2">
                            <MapPin className="h-5 w-5 text-wine" />
                            Localização
                        </CardTitle>
                        <CardDescription>Onde sua loja está sediada</CardDescription>
                    </CardHeader>
                    <CardContent className="p-8">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="city" className="text-sm font-semibold text-gray-700">Cidade</Label>
                                <Input
                                    id="city"
                                    value={formData.city}
                                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                                    placeholder="Ex: São Paulo"
                                    className="h-11 rounded-xl"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="state" className="text-sm font-semibold text-gray-700">Estado (UF)</Label>
                                <Input
                                    id="state"
                                    value={formData.state}
                                    onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                                    placeholder="Ex: SP"
                                    maxLength={2}
                                    className="h-11 rounded-xl"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end pt-4">
                    <Button
                        type="submit"
                        variant="wine"
                        disabled={saving}
                        className="rounded-xl px-12 py-6 text-lg shadow-wine hover:scale-105 transition-all"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Salvando Alterações...
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-5 w-5" />
                                Salvar Configurações
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}

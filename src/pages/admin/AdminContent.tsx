import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useRole } from '@/hooks/useRole';
import { useSiteSettings, SiteSetting } from '@/hooks/useSiteSettings';
import { storageService } from '@/services/storage.service';
import { Loader2, Save, LayoutTemplate, Image as ImageIcon, Type, Plus, X, Upload, Link as LinkIcon, Trash } from 'lucide-react';
import { toast } from 'sonner';

const AdminContent = () => {
    const { isAdmin } = useRole();
    const { settings, loading, updateSetting, refetch } = useSiteSettings();
    const [localSettings, setLocalSettings] = useState<SiteSetting[]>([]);
    const [saving, setSaving] = useState<Record<string, boolean>>({});
    const [uploading, setUploading] = useState<Record<string, boolean>>({});
    // Track active tab for each setting
    const [activeImageTab, setActiveImageTab] = useState<Record<string, 'upload' | 'url'>>({});
    const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

    useEffect(() => {
        if (settings.length > 0) {
            setLocalSettings(settings);
        }
    }, [settings]);

    if (!isAdmin) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">Acesso negado</p>
            </div>
        );
    }

    if (loading && localSettings.length === 0) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const handleInputChange = (id: string, value: any) => {
        setLocalSettings(prev =>
            prev.map(item =>
                item.id === id ? { ...item, value } : item
            )
        );
    };

    const handleSave = async (setting: SiteSetting) => {
        try {
            setSaving(prev => ({ ...prev, [setting.id]: true }));
            await updateSetting(setting.id, setting.value);
        } catch (error) {
            // Error is handled in the hook
        } finally {
            setSaving(prev => ({ ...prev, [setting.id]: false }));
        }
    };

    const handleFileUpload = async (settingId: string, file: File) => {
        try {
            setUploading(prev => ({ ...prev, [settingId]: true }));

            const result = await storageService.uploadCMSImage(file);

            if (result.error) {
                throw result.error;
            }

            if (result.data) {
                // Find current setting
                const setting = localSettings.find(s => s.id === settingId);
                if (!setting) return;

                let newValue;
                if (setting.type === 'image_array') {
                    const currentArray = Array.isArray(setting.value) ? setting.value : [];
                    newValue = [...currentArray, result.data.publicUrl];
                } else {
                    newValue = result.data.publicUrl;
                }

                handleInputChange(settingId, newValue);
                toast.success('Imagem enviada com sucesso!');
            }
        } catch (error) {
            console.error('Upload error:', error);
            toast.error('Erro ao enviar imagem');
        } finally {
            setUploading(prev => ({ ...prev, [settingId]: false }));
            // Reset input
            if (fileInputRefs.current[settingId]) {
                fileInputRefs.current[settingId]!.value = '';
            }
        }
    };

    const handleAddUrl = (settingId: string, url: string) => {
        const setting = localSettings.find(s => s.id === settingId);
        if (!setting) return;

        if (setting.type === 'image_array') {
            const currentArray = Array.isArray(setting.value) ? setting.value : [];
            handleInputChange(settingId, [...currentArray, url]);
            toast.success('URL adicionada!');
        } else {
            handleInputChange(settingId, url);
        }
    };

    const handleRemoveImage = (settingId: string, index: number) => {
        const setting = localSettings.find(s => s.id === settingId);
        if (!setting || !Array.isArray(setting.value)) return;

        const newArray = [...setting.value];
        newArray.splice(index, 1);
        handleInputChange(settingId, newArray);
    };

    // Group settings by section
    const sections = Array.from(new Set(localSettings.map(s => s.section)));

    const renderSettingInput = (setting: SiteSetting) => {
        // Hide legacy bg_image if we are in hero section
        if (setting.section === 'hero' && setting.key === 'bg_image') {
            return null;
        }

        // Helper to safely get value logic
        const getValue = (val: any) => {
            if (setting.type === 'image_array') {
                return Array.isArray(val) ? val : [];
            }
            if (typeof val === 'string' && val.startsWith('"') && val.endsWith('"')) {
                return val.slice(1, -1);
            }
            return val;
        };

        const displayValue = getValue(setting.value);

        // Specific render for Array of Images
        if (setting.type === 'image_array') {
            const images: string[] = Array.isArray(displayValue) ? displayValue : [];
            const currentTab = activeImageTab[setting.id] || 'upload';

            return (
                <div key={setting.id} className="grid gap-4 py-6 border-b last:border-0 border-border">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                        <div className="md:col-span-4">
                            <Label htmlFor={setting.id} className="font-semibold text-lg">
                                {setting.label}
                            </Label>
                            <p className="text-sm text-muted-foreground mt-2">
                                Gerencie as imagens do carrossel. Você pode fazer upload ou colar URLs.
                                A ordem das imagens aqui será a ordem de exibição.
                            </p>
                        </div>

                        <div className="md:col-span-8 space-y-6">
                            {/* List of existing images */}
                            {images.length > 0 && (
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {images.map((img, idx) => (
                                        <div key={idx} className="relative group aspect-video bg-muted rounded-lg overflow-hidden border shadow-sm">
                                            <img src={img} alt={`Slide ${idx + 1}`} className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <Button
                                                    variant="destructive"
                                                    size="icon"
                                                    onClick={() => handleRemoveImage(setting.id, idx)}
                                                    className="h-8 w-8"
                                                >
                                                    <Trash className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
                                                {idx + 1}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Add New Image Area */}
                            <div className="bg-muted/30 border rounded-lg p-4">
                                <Tabs
                                    value={currentTab}
                                    onValueChange={(val) => setActiveImageTab(prev => ({ ...prev, [setting.id]: val as 'upload' | 'url' }))}
                                    className="w-full"
                                >
                                    <TabsList className="w-full grid grid-cols-2 mb-4">
                                        <TabsTrigger value="upload" className="flex items-center gap-2">
                                            <Upload className="h-4 w-4" /> Upload
                                        </TabsTrigger>
                                        <TabsTrigger value="url" className="flex items-center gap-2">
                                            <LinkIcon className="h-4 w-4" /> Link Externo
                                        </TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="upload" className="mt-0">
                                        <div
                                            className="border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center gap-4 text-center cursor-pointer hover:bg-muted/50 transition-colors bg-background"
                                            onClick={() => fileInputRefs.current[setting.id]?.click()}
                                        >
                                            <div className="p-3 bg-primary/10 rounded-full">
                                                <Upload className="h-6 w-6 text-primary" />
                                            </div>
                                            <div>
                                                <p className="font-medium">Clique para selecionar</p>
                                                <p className="text-sm text-muted-foreground">ou arraste e solte aqui</p>
                                            </div>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                ref={el => fileInputRefs.current[setting.id] = el}
                                                onChange={(e) => {
                                                    if (e.target.files?.[0]) {
                                                        handleFileUpload(setting.id, e.target.files[0]);
                                                    }
                                                }}
                                            />
                                            {uploading[setting.id] && (
                                                <span className="text-sm text-primary flex items-center gap-2">
                                                    <Loader2 className="h-3 w-3 animate-spin" /> Enviando...
                                                </span>
                                            )}
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="url" className="mt-0">
                                        <div className="flex gap-2">
                                            <Input
                                                placeholder="https://exemplo.com/imagem.jpg"
                                                className="flex-1"
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        const target = e.currentTarget;
                                                        const val = target.value;
                                                        if (val) {
                                                            handleAddUrl(setting.id, val);
                                                            target.value = '';
                                                        }
                                                    }
                                                }}
                                            />
                                            <Button variant="secondary" onClick={(e) => {
                                                // Find the input sibling
                                                const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                                                if (input && input.value) {
                                                    handleAddUrl(setting.id, input.value);
                                                    input.value = '';
                                                }
                                            }}>
                                                <Plus className="h-4 w-4 mr-2" /> Adicionar
                                            </Button>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-2">
                                            Cole o link <strong>direto</strong> da imagem (terminado em .jpg, .png, etc). Links de páginas (ex: unsplash.com/fotos/...) não funcionam.
                                        </p>
                                    </TabsContent>
                                </Tabs>
                            </div>

                            <div className="flex justify-end pt-2">
                                <Button
                                    onClick={() => handleSave(setting)}
                                    disabled={saving[setting.id]}
                                >
                                    {saving[setting.id] ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                                    Salvar Alterações
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        // Default render for text/other
        return (
            <div key={setting.id} className="grid gap-4 py-4 border-b last:border-0 border-border">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                    <div className="md:col-span-1">
                        <Label htmlFor={setting.id} className="font-medium text-base">
                            {setting.label}
                        </Label>
                        <p className="text-xs text-muted-foreground mt-1 text-ellipsis overflow-hidden">
                            Key: {setting.key}
                        </p>
                    </div>

                    <div className="md:col-span-2">
                        {(setting.key === 'terms_of_use' || setting.key === 'privacy_policy') ? (
                            <textarea
                                id={setting.id}
                                value={displayValue}
                                onChange={(e) => {
                                    const val = JSON.stringify(e.target.value);
                                    handleInputChange(setting.id, val);
                                }}
                                className="w-full min-h-[200px] p-3 rounded-md border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            />
                        ) : (setting.type === 'text' || setting.type === 'number' || setting.type === 'image') && (
                            <div className="relative">
                                <Input
                                    id={setting.id}
                                    value={displayValue}
                                    onChange={(e) => {
                                        const val = JSON.stringify(e.target.value);
                                        handleInputChange(setting.id, val);
                                    }}
                                    className={setting.type === 'image' ? 'pl-9' : ''}
                                />
                                {setting.type === 'image' && (
                                    <ImageIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                )}
                                {setting.type === 'text' && (
                                    <Type className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground opacity-0" /> // Placeholder
                                )}
                            </div>
                        )}
                    </div>

                    <div className="md:col-span-1 flex justify-end">
                        <Button
                            onClick={() => handleSave(setting)}
                            disabled={saving[setting.id]}
                            size="sm"
                        >
                            {saving[setting.id] ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                                <Save className="h-4 w-4 mr-2" />
                            )}
                            Salvar
                        </Button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Gerenciar Conteúdo</h1>
                    <p className="text-muted-foreground">
                        Personalize textos, imagens e seções do site
                    </p>
                </div>
            </div>

            <Tabs defaultValue={sections[0] || 'hero'} className="w-full">
                <TabsList className="w-full justify-start overflow-x-auto">
                    {sections.map(section => (
                        <TabsTrigger key={section} value={section} className="capitalize">
                            {section}
                        </TabsTrigger>
                    ))}
                </TabsList>

                {sections.map(section => (
                    <TabsContent key={section} value={section}>
                        <Card>
                            <CardHeader>
                                <CardTitle className="capitalize flex items-center gap-2">
                                    <LayoutTemplate className="h-5 w-5" />
                                    Seção: {section}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {localSettings
                                    .filter(s => s.section === section)
                                    // Sort ensuring text inputs come first, larger inputs like array last
                                    .sort((a, b) => (a.type === 'image_array' ? 1 : -1) - (b.type === 'image_array' ? 1 : -1))
                                    .map(renderSettingInput)}
                            </CardContent>
                        </Card>
                    </TabsContent>
                ))}
            </Tabs>
        </div>
    );
};

export default AdminContent;

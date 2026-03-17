import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@theadoro/ui';
import { Button } from '@theadoro/ui';
import { Input } from '@theadoro/ui';
import { Label } from '@theadoro/ui';
import { Textarea } from '@theadoro/ui';
import { Switch } from '@theadoro/ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@theadoro/ui';
import { Avatar, AvatarFallback, AvatarImage } from '@theadoro/ui';
import { Badge } from '@theadoro/ui';
import { useAuth } from '@/contexts/AuthContext';
import { useRole } from '@/hooks/useRole';
import { useOrders } from '@/hooks/useOrders';
import { useProfile } from '@/hooks/useProfile';
import { UserProfile } from '@/types/auth';
import {
  User,
  MapPin,
  Bell,
  Shield,
  Camera,
  Save,
  Edit,
  CreditCard,
  Heart,
  ShoppingCart
} from 'lucide-react';

export default function BuyerProfile() {
  const { user } = useAuth();
  const { hasRole } = useRole();
  const {
    profile: authProfile,
    loading: profileLoading,
    activity,
    fetchActivity,
    updateProfile,
    updateAvatar
  } = useProfile();

  const [localProfile, setLocalProfile] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const isBuyer = hasRole('buyer');

  const { stats, fetchStats } = useOrders({
    scope: 'buyer',
    fetchOnMount: true
  });

  useEffect(() => {
    if (user && isBuyer) {
      fetchStats();
      fetchActivity();
    }
  }, [user, isBuyer, fetchStats, fetchActivity]);

  useEffect(() => {
    if (authProfile) {
      // Map flat profile to UI structure (if we want to keep the UI structure)
      // Or we can adjust the UI. Let's map for minimal UI disruption.
      // Actually, let's use the local state to hold the form data.
      setLocalProfile({
        ...authProfile,
        // Ensure preferences object exists
        preferences: authProfile.preferences || {
          email_notifications: true,
          sms_notifications: false,
          marketing_emails: true,
          order_updates: true
        },
        // Normalize address for the form if needed, or just use flat fields
        // The previous UI used a nested 'address' object. 
        // Let's reconstruct it for the form state to match existing input bindings,
        // OR update the input bindings to use flat fields.
        // Updating input bindings is cleaner.
        addressStr: authProfile.address || '',
        addressNumber: (authProfile as any).address_number || '',
        addressComplement: (authProfile as any).address_complement || '',
        neighborhood: (authProfile as any).neighborhood || '',
        city: authProfile.city || '',
        state: authProfile.state || '',
        zipCode: authProfile.postal_code || '',
        birthDate: (authProfile as any).birth_date || ''
      });
    }
  }, [authProfile]);

  const handleSaveProfile = async () => {
    if (!localProfile || !user) return;

    try {
      setSaving(true);

      const updates: Partial<UserProfile> = {
        full_name: localProfile.full_name,
        phone: localProfile.phone,
        bio: localProfile.bio,
        // Map back to flat fields
        address: localProfile.addressStr,
        city: localProfile.city,
        state: localProfile.state,
        postal_code: localProfile.zipCode,
        // Extra fields that might need to be added to UserProfile or passed as any if strict
        preferences: localProfile.preferences,
      };

      // Handle extra fields via 'any' cast if they are not in UserProfile yet (like birth_date)
      // or add them to UserProfile. I'll cast for now.
      const extraUpdates = {
        birth_date: localProfile.birthDate,
        address_number: localProfile.addressNumber,
        address_complement: localProfile.addressComplement,
        neighborhood: localProfile.neighborhood,
      };

      await updateProfile({ ...updates, ...extraUpdates } as any);

      setIsEditing(false);
    } catch (error: any) {
      console.error('Error saving profile:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      await updateAvatar(file);
    }
  };

  if (!isBuyer) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Acesso negado</p>
      </div>
    );
  }

  if (profileLoading || !localProfile) {
    return (
      <div className="space-y-6 container mx-auto px-4 pb-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-48" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 container mx-auto px-4 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Meu Perfil</h1>
          <p className="text-muted-foreground">
            Gerencie suas informações pessoais e preferências
          </p>
        </div>
        <Button
          onClick={() => isEditing ? handleSaveProfile() : setIsEditing(true)}
          disabled={saving}
        >
          {isEditing ? (
            <>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Salvando...' : 'Salvar'}
            </>
          ) : (
            <>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </>
          )}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Pedidos</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_orders || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Gasto</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {(stats?.total_revenue || 0).toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lista de Desejos</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activity?.wishlist_count || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avaliações Feitas</CardTitle>
            <Badge className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activity?.reviews_count || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="personal" className="space-y-6">
        <TabsList>
          <TabsTrigger value="personal">Informações Pessoais</TabsTrigger>
          <TabsTrigger value="address">Endereço</TabsTrigger>
          <TabsTrigger value="preferences">Preferências</TabsTrigger>
          <TabsTrigger value="security">Segurança</TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informações Pessoais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar */}
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={localProfile.avatar_url} />
                  <AvatarFallback>
                    {localProfile.full_name?.split(' ').map((n: string) => n[0]).join('') || 'U'}
                  </AvatarFallback>
                </Avatar>
                {isEditing && (
                  <div>
                    <Label htmlFor="avatar" className="cursor-pointer">
                      <Button variant="outline" size="sm" asChild>
                        <span>
                          <Camera className="h-4 w-4 mr-2" />
                          Alterar Foto
                        </span>
                      </Button>
                    </Label>
                    <Input
                      id="avatar"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarChange}
                    />
                  </div>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Nome Completo</Label>
                  <Input
                    id="full_name"
                    value={localProfile.full_name || ''}
                    onChange={(e) => setLocalProfile({ ...localProfile, full_name: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={localProfile.email || ''}
                    disabled
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={localProfile.phone || ''}
                    onChange={(e) => setLocalProfile({ ...localProfile, phone: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="birth_date">Data de Nascimento</Label>
                  <Input
                    id="birth_date"
                    type="date"
                    value={localProfile.birthDate || ''}
                    onChange={(e) => setLocalProfile({ ...localProfile, birthDate: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="address" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Endereço
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="street">Rua</Label>
                  <Input
                    id="street"
                    value={localProfile.addressStr || ''}
                    onChange={(e) => setLocalProfile({ ...localProfile, addressStr: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="number">Número</Label>
                  <Input
                    id="number"
                    value={localProfile.addressNumber || ''}
                    onChange={(e) => setLocalProfile({ ...localProfile, addressNumber: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="complement">Complemento</Label>
                  <Input
                    id="complement"
                    value={localProfile.addressComplement || ''}
                    onChange={(e) => setLocalProfile({ ...localProfile, addressComplement: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="neighborhood">Bairro</Label>
                  <Input
                    id="neighborhood"
                    value={localProfile.neighborhood || ''}
                    onChange={(e) => setLocalProfile({ ...localProfile, neighborhood: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="city">Cidade</Label>
                  <Input
                    id="city"
                    value={localProfile.city || ''}
                    onChange={(e) => setLocalProfile({ ...localProfile, city: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">Estado</Label>
                  <Input
                    id="state"
                    value={localProfile.state || ''}
                    onChange={(e) => setLocalProfile({ ...localProfile, state: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zip_code">CEP</Label>
                  <Input
                    id="zip_code"
                    value={localProfile.zipCode || ''}
                    onChange={(e) => setLocalProfile({ ...localProfile, zipCode: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Preferências de Notificação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notificações por Email</Label>
                  <p className="text-sm text-muted-foreground">
                    Receba atualizações importantes por email
                  </p>
                </div>
                <Switch
                  checked={localProfile.preferences?.email_notifications}
                  onCheckedChange={(checked) => setLocalProfile({
                    ...localProfile,
                    preferences: { ...localProfile.preferences, email_notifications: checked }
                  })}
                  disabled={!isEditing}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notificações por SMS</Label>
                  <p className="text-sm text-muted-foreground">
                    Receba alertas urgentes por SMS
                  </p>
                </div>
                <Switch
                  checked={localProfile.preferences?.sms_notifications}
                  onCheckedChange={(checked) => setLocalProfile({
                    ...localProfile,
                    preferences: { ...localProfile.preferences, sms_notifications: checked }
                  })}
                  disabled={!isEditing}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Emails de Marketing</Label>
                  <p className="text-sm text-muted-foreground">
                    Receba ofertas especiais e novidades
                  </p>
                </div>
                <Switch
                  checked={localProfile.preferences?.marketing_emails}
                  onCheckedChange={(checked) => setLocalProfile({
                    ...localProfile,
                    preferences: { ...localProfile.preferences, marketing_emails: checked }
                  })}
                  disabled={!isEditing}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Atualizações de Pedidos</Label>
                  <p className="text-sm text-muted-foreground">
                    Receba notificações sobre o status dos seus pedidos
                  </p>
                </div>
                <Switch
                  checked={localProfile.preferences?.order_updates}
                  onCheckedChange={(checked) => setLocalProfile({
                    ...localProfile,
                    preferences: { ...localProfile.preferences, order_updates: checked }
                  })}
                  disabled={!isEditing}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Segurança da Conta
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Alterar Senha</Label>
                <Button variant="outline">
                  Alterar Senha
                </Button>
                <p className="text-sm text-muted-foreground">
                  Última alteração: há 3 meses
                </p>
              </div>

              <div className="space-y-2">
                <Label>Autenticação de Dois Fatores</Label>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Desabilitado</Badge>
                  <Button variant="outline" size="sm">
                    Habilitar 2FA
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Adicione uma camada extra de segurança à sua conta
                </p>
              </div>

              <div className="space-y-2">
                <Label>Sessões Ativas</Label>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <p className="font-medium">Navegador atual</p>
                      <p className="text-sm text-muted-foreground">
                        Chrome no Windows • São Paulo, SP
                      </p>
                    </div>
                    <Badge>Atual</Badge>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  Ver Todas as Sessões
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
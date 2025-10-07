import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useRole } from '@/hooks/useRole';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Bell,
  Shield,
  Camera,
  Save,
  Edit,
  CreditCard,
  Heart,
  ShoppingCart
} from 'lucide-react';

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  birth_date: string;
  address: {
    street: string;
    number: string;
    complement: string;
    neighborhood: string;
    city: string;
    state: string;
    zip_code: string;
  };
  avatar_url: string;
  bio: string;
  preferences: {
    email_notifications: boolean;
    sms_notifications: boolean;
    marketing_emails: boolean;
    order_updates: boolean;
  };
  stats: {
    total_orders: number;
    total_spent: number;
    wishlist_items: number;
    reviews_given: number;
  };
}

export default function BuyerProfile() {
  const { user } = useAuth();
  const { hasRole } = useRole();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const isBuyer = hasRole('buyer');

  useEffect(() => {
    if (user && isBuyer) {
      loadProfile();
    }
  }, [user, isBuyer]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      
      // Mock data - replace with actual API calls
      const mockProfile: UserProfile = {
        id: user?.id || '1',
        email: user?.email || 'comprador@example.com',
        full_name: 'João Silva',
        phone: '(11) 99999-9999',
        birth_date: '1990-05-15',
        address: {
          street: 'Rua das Flores',
          number: '123',
          complement: 'Apto 45',
          neighborhood: 'Centro',
          city: 'São Paulo',
          state: 'SP',
          zip_code: '01234-567'
        },
        avatar_url: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20avatar%20male%20friendly%20smile&image_size=square',
        bio: 'Apaixonado por presentes únicos e artesanais. Sempre em busca de produtos especiais para momentos importantes.',
        preferences: {
          email_notifications: true,
          sms_notifications: false,
          marketing_emails: true,
          order_updates: true
        },
        stats: {
          total_orders: 15,
          total_spent: 2450.80,
          wishlist_items: 8,
          reviews_given: 12
        }
      };

      setProfile(mockProfile);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!profile) return;
    
    try {
      setSaving(true);
      
      // Save profile - replace with actual API call
      console.log('Saving profile:', profile);
      
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && profile) {
      // Handle avatar upload - replace with actual upload logic
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfile({
          ...profile,
          avatar_url: e.target?.result as string
        });
      };
      reader.readAsDataURL(file);
    }
  };

  if (!isBuyer) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Acesso negado</p>
      </div>
    );
  }

  if (loading || !profile) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-48 mb-2" />
          <div className="h-4 bg-muted rounded w-64" />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-32" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="h-4 bg-muted rounded" />
                  <div className="h-4 bg-muted rounded w-3/4" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
            <div className="text-2xl font-bold">{profile.stats.total_orders}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Gasto</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {profile.stats.total_spent.toFixed(2)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lista de Desejos</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profile.stats.wishlist_items}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avaliações Feitas</CardTitle>
            <Badge className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profile.stats.reviews_given}</div>
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
                  <AvatarImage src={profile.avatar_url} />
                  <AvatarFallback>
                    {profile.full_name.split(' ').map(n => n[0]).join('')}
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
                    value={profile.full_name}
                    onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    disabled
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="birth_date">Data de Nascimento</Label>
                  <Input
                    id="birth_date"
                    type="date"
                    value={profile.birth_date}
                    onChange={(e) => setProfile({ ...profile, birth_date: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Biografia</Label>
                <Textarea
                  id="bio"
                  value={profile.bio}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  disabled={!isEditing}
                  rows={3}
                />
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
                    value={profile.address.street}
                    onChange={(e) => setProfile({
                      ...profile,
                      address: { ...profile.address, street: e.target.value }
                    })}
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="number">Número</Label>
                  <Input
                    id="number"
                    value={profile.address.number}
                    onChange={(e) => setProfile({
                      ...profile,
                      address: { ...profile.address, number: e.target.value }
                    })}
                    disabled={!isEditing}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="complement">Complemento</Label>
                  <Input
                    id="complement"
                    value={profile.address.complement}
                    onChange={(e) => setProfile({
                      ...profile,
                      address: { ...profile.address, complement: e.target.value }
                    })}
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="neighborhood">Bairro</Label>
                  <Input
                    id="neighborhood"
                    value={profile.address.neighborhood}
                    onChange={(e) => setProfile({
                      ...profile,
                      address: { ...profile.address, neighborhood: e.target.value }
                    })}
                    disabled={!isEditing}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="city">Cidade</Label>
                  <Input
                    id="city"
                    value={profile.address.city}
                    onChange={(e) => setProfile({
                      ...profile,
                      address: { ...profile.address, city: e.target.value }
                    })}
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">Estado</Label>
                  <Input
                    id="state"
                    value={profile.address.state}
                    onChange={(e) => setProfile({
                      ...profile,
                      address: { ...profile.address, state: e.target.value }
                    })}
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zip_code">CEP</Label>
                  <Input
                    id="zip_code"
                    value={profile.address.zip_code}
                    onChange={(e) => setProfile({
                      ...profile,
                      address: { ...profile.address, zip_code: e.target.value }
                    })}
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
                  checked={profile.preferences.email_notifications}
                  onCheckedChange={(checked) => setProfile({
                    ...profile,
                    preferences: { ...profile.preferences, email_notifications: checked }
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
                  checked={profile.preferences.sms_notifications}
                  onCheckedChange={(checked) => setProfile({
                    ...profile,
                    preferences: { ...profile.preferences, sms_notifications: checked }
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
                  checked={profile.preferences.marketing_emails}
                  onCheckedChange={(checked) => setProfile({
                    ...profile,
                    preferences: { ...profile.preferences, marketing_emails: checked }
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
                  checked={profile.preferences.order_updates}
                  onCheckedChange={(checked) => setProfile({
                    ...profile,
                    preferences: { ...profile.preferences, order_updates: checked }
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
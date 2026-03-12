import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useRole } from '@/hooks/useRole';
import { useUsers } from '@/hooks/useUsers';
import { userService } from '@/services/user.service';
import { UserProfile, UserRole } from '@/types/auth';
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Shield,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { toast } from 'sonner';

interface UserFormData {
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  status: 'active' | 'inactive' | 'pending';
}

const AdminUsers = () => {
  const { user } = useAuth();
  const { isAdmin } = useRole();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState<UserFormData>({
    name: '',
    email: '',
    phone: '',
    role: 'buyer',
    status: 'active'
  });

  const {
    users,
    loading,
    fetchUsers,
    assignRole,
    deleteUser,
    toggleStatus
  } = useUsers({ fetchOnMount: true });

  useEffect(() => {
    if (!isAdmin) {
      toast.error('Acesso negado. Apenas administradores podem acessar esta página.');
      return;
    }
  }, [isAdmin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingUser) {
        // Update existing user
        const { error } = await userService.updateProfile(editingUser.id, {
          full_name: formData.name,
          phone: formData.phone,
          status: formData.status
          // Role is handled via assignRole but we can try to update it here too if needed, 
          // but assignRole is better for consistency.
        });

        if (error) throw error;

        // If role changed, call assignRole
        if (editingUser.role !== formData.role && formData.role) {
          await userService.assignRole(editingUser.id, formData.role);
        }

        toast.success('Usuário atualizado com sucesso!');
      } else {
        // Create new user (Profile only - Auth user creation requires server-side admin API)
        // For now we just create the profile, but in reality this is incomplete without Auth.
        // Assuming there is a way to create users via this UI in the future.
        const { error } = await userService.create({
          full_name: formData.name,
          email: formData.email,
          phone: formData.phone,
          role: formData.role,
          status: formData.status
        } as any); // Type cast due to strict UserProfile vs CreateDTO

        if (error) throw error;
        toast.success('Perfil de usuário criado com sucesso!');
      }

      setIsDialogOpen(false);
      resetForm();
      fetchUsers();
    } catch (error) {
      console.error('Erro ao salvar usuário:', error);
      toast.error('Erro ao salvar usuário');
    }
  };

  const handleEdit = (user: UserProfile) => {
    setEditingUser(user);
    setFormData({
      name: user.full_name || '',
      email: user.email || '',
      phone: user.phone || '',
      role: user.role || 'buyer',
      status: user.status || 'active'
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('Tem certeza que deseja excluir este usuário?')) return;
    await deleteUser(userId);
  };

  const handleRoleToggle = async (user: UserProfile) => {
    // Defines the next role in a cycle or simple toggle
    // Logic: Buyer -> Seller -> Start over? 
    // Or just "Promote to Seller" / "Demote to Buyer"
    const currentRole = user.role || 'buyer';
    const newRole = currentRole === 'seller' ? 'buyer' : 'seller';

    if (confirm(`Deseja alterar a função de ${currentRole} para ${newRole}?`)) {
      await assignRole(user.id, newRole);
    }
  };

  const handleStatusToggle = async (user: UserProfile) => {
    await toggleStatus(user.id);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      role: 'buyer',
      status: 'active'
    });
    setEditingUser(null);
  };

  const columns = [
    {
      key: 'full_name',
      title: 'Nome',
      render: (value: string) => value || 'N/A'
    },
    {
      key: 'email',
      title: 'Email'
    },
    {
      key: 'role',
      title: 'Função',
      render: (_: string, row: UserProfile) => {
        // Source of truth: user_roles table (row.roles), fallback to profile role
        const roles = row.roles?.map((r: any) => r.role) || [];
        // Check if roles is populated, otherwise use row.role
        const displayRole = roles.length > 0
          ? (roles.includes('admin') ? 'admin' : roles.includes('seller') ? 'seller' : 'buyer')
          : row.role || 'buyer';

        return (
          <Badge variant={displayRole === 'admin' ? 'destructive' : displayRole === 'seller' ? 'default' : 'secondary'}>
            {displayRole === 'admin' ? 'Administrador' :
              displayRole === 'seller' ? 'Vendedor' : 'Comprador'}
          </Badge>
        );
      }
    },
    {
      key: 'status',
      title: 'Status',
      render: (value: string) => (
        <Badge variant={value === 'active' ? 'outline' : 'secondary'}>
          {value === 'active' ? 'Ativo' : value === 'pending' ? 'Pendente' : 'Inativo'}
        </Badge>
      )
    },
    {
      key: 'created_at',
      title: 'Data de Cadastro',
      render: (value: string) => new Date(value).toLocaleDateString('pt-BR')
    }
  ];

  const actions = [
    {
      label: 'Editar',
      icon: <Edit className="h-4 w-4" />,
      onClick: (item: UserProfile) => handleEdit(item)
    },
    {
      label: 'Alterar Função',
      icon: <ShieldCheck className="h-4 w-4" />,
      onClick: (item: UserProfile) => handleRoleToggle(item)
    },
    {
      label: 'Alterar Status',
      icon: <UserCheck className="h-4 w-4" />,
      onClick: (item: UserProfile) => handleStatusToggle(item)
    },
    {
      label: 'Excluir',
      icon: <Trash2 className="h-4 w-4" />,
      onClick: (item: UserProfile) => handleDelete(item.id),
      variant: 'destructive' as const,
      show: (item: UserProfile) => item.id !== user?.id
    }
  ];

  const [promoteEmail, setPromoteEmail] = useState('');
  const [isPromoting, setIsPromoting] = useState(false);

  const handlePromoteByEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoteEmail) return;

    try {
      setIsPromoting(true);
      const { error } = await userService.updateRoleByEmail(promoteEmail, 'admin');
      
      if (error) throw error;

      toast.success(`Usuário ${promoteEmail} agora é um Administrador Master!`);
      setPromoteEmail('');
      fetchUsers();
    } catch (error: any) {
      console.error('Erro ao promover usuário:', error);
      toast.error(error.message || 'Erro ao promover usuário. Verifique se o e-mail está correto e cadastrado.');
    } finally {
      setIsPromoting(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Acesso negado</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gerenciar Usuários</h1>
          <p className="text-muted-foreground">
            Gerencie usuários, funções e permissões do sistema
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Usuário
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
              </DialogTitle>
              <DialogDescription>
                {editingUser
                  ? 'Edite as informações do usuário abaixo.'
                  : 'Preencha as informações para criar um novo usuário.'
                }
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    disabled={!!editingUser}
                    required={!editingUser}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="role">Função</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => setFormData({ ...formData, role: value as UserRole })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma função" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="buyer">Comprador</SelectItem>
                      <SelectItem value="seller">Vendedor</SelectItem>
                      <SelectItem value="admin">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value as 'active' | 'inactive' | 'pending' })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="inactive">Inativo</SelectItem>
                      <SelectItem value="pending">Pendente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingUser ? 'Salvar' : 'Criar'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* NOVO: Espaço para promover sócias por e-mail */}
      <Card className="border-purple-100 bg-purple-50/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2 text-purple-800">
            <ShieldCheck className="h-5 w-5" />
            Promoção de Administradores Master
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 space-y-2">
              <Label htmlFor="promote-email" className="text-purple-700">E-mail da Sócia/Colaboradora</Label>
              <Input
                id="promote-email"
                type="email"
                placeholder="exemplo@theadoro.com.br"
                value={promoteEmail}
                onChange={(e) => setPromoteEmail(e.target.value)}
                className="bg-white border-purple-200 focus-visible:ring-purple-400"
              />
            </div>
            <Button 
              onClick={handlePromoteByEmail} 
              disabled={isPromoting || !promoteEmail}
              className="bg-purple-600 hover:bg-purple-700 text-white min-w-[180px]"
            >
              {isPromoting ? 'Processando...' : 'Tornar Admin Master'}
            </Button>
          </div>
          <p className="text-[11px] text-purple-600 mt-2 italic">
            * O usuário deve estar previamente cadastrado no sistema para ser promovido.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Lista de Usuários
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={users || []}
            columns={columns}
            loading={loading}
            actions={actions}
            searchPlaceholder="Buscar por nome ou email..."
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminUsers;
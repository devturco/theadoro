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
import { useCRUD } from '@/hooks/useCRUD';
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Shield, 
  ShieldCheck,
  UserCheck,
  UserX,
  Search
} from 'lucide-react';
import { toast } from 'sonner';
import { UserRole } from '@/types/auth';

interface UserFormData {
  name: string;
  email: string;
  role: string;
  status: string;
}

const AdminUsers = () => {
  const { user } = useAuth();
  const { isAdmin } = useRole();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [formData, setFormData] = useState<UserFormData>({
    name: '',
    email: '',
    role: 'buyer',
    status: 'approved'
  });

  const {
    data: users,
    loading,
    createItem,
    updateItem,
    deleteItem,
    refetch
  } = useCRUD({ table: 'users' });

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
        await updateItem(editingUser.id, {
          name: formData.name,
          roles: [{ role: formData.role, status: formData.status }]
        });
        toast.success('Usuário atualizado com sucesso!');
      } else {
        await createItem({
          name: formData.name,
          email: formData.email,
          roles: [{ role: formData.role, status: formData.status }]
        });
        toast.success('Usuário criado com sucesso!');
      }
      
      setIsDialogOpen(false);
      resetForm();
      refetch();
    } catch (error) {
      console.error('Erro ao salvar usuário:', error);
      toast.error('Erro ao salvar usuário');
    }
  };

  const handleEdit = (user: any) => {
    setEditingUser(user);
    setFormData({
      name: user.name || '',
      email: user.email || '',
      role: user.roles?.[0]?.role || 'buyer',
      status: user.roles?.[0]?.status || 'approved'
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('Tem certeza que deseja excluir este usuário?')) return;
    
    try {
      await deleteItem(userId);
      toast.success('Usuário excluído com sucesso!');
      refetch();
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      toast.error('Erro ao excluir usuário');
    }
  };

  const handleToggleStatus = async (user: any) => {
    const currentStatus = user.roles?.[0]?.status || 'pending';
    const newStatus = currentStatus === 'approved' ? 'pending' : 'approved';
    
    try {
      await updateItem(user.id, {
        roles: [{ 
          role: user.roles?.[0]?.role || 'buyer', 
          status: newStatus 
        }]
      });
      toast.success(`Usuário ${newStatus === 'approved' ? 'aprovado' : 'suspenso'} com sucesso!`);
      refetch();
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      toast.error('Erro ao alterar status do usuário');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      role: 'buyer',
      status: 'approved'
    });
    setEditingUser(null);
  };

  const columns = [
    {
      key: 'name',
      title: 'Nome',
      render: (value: string) => value || 'N/A'
    },
    {
      key: 'email',
      title: 'Email'
    },
    {
      key: 'roles',
      title: 'Função',
      render: (roles: UserRole[]) => {
        const role = roles?.[0]?.role || 'buyer';
        return (
          <Badge variant={role === 'admin' ? 'destructive' : role === 'seller' ? 'default' : 'secondary'}>
            {role === 'admin' ? 'Administrador' : 
             role === 'seller' ? 'Vendedor' : 'Comprador'}
          </Badge>
        );
      }
    },
    {
      key: 'status',
      title: 'Status',
      render: (_: any, row: any) => {
        const status = row.roles?.[0]?.status || 'pending';
        return (
          <Badge variant={status === 'approved' ? 'default' : 'secondary'}>
            {status === 'approved' ? 'Aprovado' : 'Pendente'}
          </Badge>
        );
      }
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
      onClick: (item: any) => handleEdit(item)
    },
    {
      label: 'Alterar Status',
      icon: <UserCheck className="h-4 w-4" />,
      onClick: (item: any) => handleToggleStatus(item)
    },
    {
      label: 'Excluir',
      icon: <Trash2 className="h-4 w-4" />,
      onClick: (item: any) => handleDelete(item.id),
      variant: 'destructive' as const,
      show: (item: any) => item.id !== user?.id
    }
  ];

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
                  <Label htmlFor="role">Função</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => setFormData({ ...formData, role: value })}
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
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="approved">Aprovado</SelectItem>
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
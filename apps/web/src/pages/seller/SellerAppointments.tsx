import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@theadoro/ui';
import { DataTable } from '@theadoro/ui';
import { Button } from '@theadoro/ui';
import { Badge } from '@theadoro/ui';
import { Input } from '@theadoro/ui';
import { Label } from '@theadoro/ui';
import { Textarea } from '@theadoro/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@theadoro/ui';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@theadoro/ui';
import { useAuth } from '@/contexts/AuthContext';
import { useRole } from '@/hooks/useRole';
import { useCRUD } from '@/hooks/useCRUD';
import {
  Calendar,
  Clock,
  User,
  CheckCircle,
  XCircle,
  Eye,
  Filter
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface AppointmentStats {
  total: number;
  pending: number;
  confirmed: number;
  completed: number;
  cancelled: number;
}

export default function SellerAppointments() {
  const { user } = useAuth();
  const { hasRole } = useRole();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [stats, setStats] = useState<AppointmentStats>({
    total: 0,
    pending: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const isSeller = hasRole('seller');

  useEffect(() => {
    if (user && isSeller) {
      loadAppointments();
    }
  }, [user, isSeller, statusFilter]);

  const loadAppointments = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          profiles:buyer_id (full_name, email)
        `)
        .eq('seller_id', user?.id)
        .order('appointment_date', { ascending: false });

      if (error) throw error;

      const processedAppointments = data?.map(app => ({
        ...app,
        buyer_name: (app.profiles as any)?.full_name || 'Cliente',
        buyer_email: (app.profiles as any)?.email || 'N/A'
      })) || [];

      // Calculate stats
      setAppointments(processedAppointments);
      setStats({
        total: processedAppointments.length,
        pending: processedAppointments.filter(a => a.status === 'pending').length,
        confirmed: processedAppointments.filter(a => a.status === 'confirmed').length,
        completed: processedAppointments.filter(a => a.status === 'completed').length,
        cancelled: processedAppointments.filter(a => a.status === 'cancelled').length
      });
    } catch (error) {
      console.error('Error loading appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewAppointment = (appointment: any) => {
    setSelectedAppointment(appointment);
    setIsDetailsOpen(true);
  };

  const handleUpdateStatus = async (appointmentId: string, newStatus: string) => {
    try {
      // Update appointment status - replace with actual API call
      setAppointments(prev =>
        prev.map(appointment =>
          appointment.id === appointmentId
            ? { ...appointment, status: newStatus }
            : appointment
        )
      );

      // Reload stats
      loadAppointments();
    } catch (error) {
      console.error('Error updating appointment status:', error);
    }
  };

  const appointmentColumns = [
    {
      key: 'buyer_name',
      title: 'Cliente',
      render: (value: string) => value || 'N/A'
    },
    {
      key: 'appointment_date',
      title: 'Data/Hora',
      render: (value: string) => {
        const date = new Date(value);
        return `${date.toLocaleDateString('pt-BR')} às ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
      }
    },
    {
      key: 'status',
      title: 'Status',
      render: (value: string) => {
        const statusMap = {
          pending: { label: 'Pendente', variant: 'secondary' as const },
          confirmed: { label: 'Confirmado', variant: 'default' as const },
          completed: { label: 'Concluído', variant: 'default' as const },
          cancelled: { label: 'Cancelado', variant: 'destructive' as const }
        };
        const status = statusMap[value as keyof typeof statusMap] || statusMap.pending;
        return <Badge variant={status.variant}>{status.label}</Badge>;
      }
    },
    {
      key: 'actions',
      title: 'Ações',
      render: (_: any, row: any) => (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleViewAppointment(row)}
          >
            <Eye className="h-4 w-4 mr-1" />
            Ver
          </Button>
          {row.status === 'pending' && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleUpdateStatus(row.id, 'confirmed')}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Confirmar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleUpdateStatus(row.id, 'cancelled')}
              >
                <XCircle className="h-4 w-4 mr-1" />
                Cancelar
              </Button>
            </>
          )}
          {row.status === 'confirmed' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleUpdateStatus(row.id, 'completed')}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Concluir
            </Button>
          )}
        </div>
      )
    }
  ];

  const filteredAppointments = appointments.filter(appointment => {
    const matchesStatus = statusFilter === 'all' || appointment.status === statusFilter;
    const matchesSearch = appointment.buyer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.buyer_email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  if (!isSeller) {
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
          <h1 className="text-3xl font-bold">Meus Agendamentos</h1>
          <p className="text-muted-foreground">
            Gerencie seus agendamentos com clientes
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confirmados</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.confirmed}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Concluídos</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cancelados</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.cancelled}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="search">Buscar por cliente</Label>
              <Input
                id="search"
                placeholder="Nome ou email do cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="confirmed">Confirmado</SelectItem>
                  <SelectItem value="completed">Concluído</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Appointments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Agendamentos</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={filteredAppointments}
            columns={appointmentColumns}
            loading={loading}
          />
        </CardContent>
      </Card>

      {/* Appointment Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Agendamento</DialogTitle>
            <DialogDescription>
              Informações completas do agendamento
            </DialogDescription>
          </DialogHeader>

          {selectedAppointment && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label className="text-sm font-medium">Cliente</Label>
                  <p className="text-sm text-muted-foreground">{selectedAppointment.buyer_name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Email</Label>
                  <p className="text-sm text-muted-foreground">{selectedAppointment.buyer_email}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Telefone</Label>
                  <p className="text-sm text-muted-foreground">{selectedAppointment.buyer_phone}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <Badge className="mt-1">
                    {selectedAppointment.status === 'pending' ? 'Pendente' :
                      selectedAppointment.status === 'confirmed' ? 'Confirmado' :
                        selectedAppointment.status === 'completed' ? 'Concluído' : 'Cancelado'}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium">Data do Agendamento</Label>
                  <p className="text-sm text-muted-foreground">
                    {new Date(selectedAppointment.appointment_date).toLocaleDateString('pt-BR')} às{' '}
                    {new Date(selectedAppointment.appointment_date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Data de Criação</Label>
                  <p className="text-sm text-muted-foreground">
                    {new Date(selectedAppointment.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Observações</Label>
                <p className="text-sm text-muted-foreground mt-1 p-3 bg-muted rounded-md">
                  {selectedAppointment.notes || 'Nenhuma observação'}
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
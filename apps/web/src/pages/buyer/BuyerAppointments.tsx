import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@theadoro/ui';
import { DataTable } from '@theadoro/ui';
import { Button } from '@theadoro/ui';
import { Badge } from '@theadoro/ui';
import { Input } from '@theadoro/ui';
import { Label } from '@theadoro/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@theadoro/ui';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@theadoro/ui';
import { useAuth } from '@/contexts/AuthContext';
import { useRole } from '@/hooks/useRole';
import { supabase } from '@/integrations/supabase/client';
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Filter,
  MapPin,
  User
} from 'lucide-react';

interface AppointmentStats {
  total: number;
  pending: number;
  confirmed: number;
  completed: number;
  cancelled: number;
}

export default function BuyerAppointments() {
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

  const isBuyer = hasRole('buyer');

  useEffect(() => {
    if (user && isBuyer) {
      loadAppointments();
    }
  }, [user, isBuyer, statusFilter]);

  const loadAppointments = async () => {
    try {
      setLoading(true);

      let query = supabase
        .from('appointments')
        .select(`
          *,
          seller:profiles!appointments_seller_id_fkey (*)
        `)
        .eq('buyer_id', user?.id)
        .order('appointment_date', { ascending: true });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter as any);
      }

      const { data, error } = await query;

      if (error) throw error;

      const mockStats: AppointmentStats = {
        total: data?.length || 0,
        pending: data?.filter(a => a.status === 'pending').length || 0,
        confirmed: data?.filter(a => a.status === 'confirmed').length || 0,
        completed: data?.filter(a => a.status === 'completed').length || 0,
        cancelled: data?.filter(a => a.status === 'cancelled').length || 0
      };

      const formattedAppointments = data?.map(appt => ({
        ...appt,
        seller_name: (appt.seller as any)?.full_name || 'Vendedor',
        seller_email: (appt.seller as any)?.email || '',
        seller_phone: (appt.seller as any)?.phone || '',
        type: 'consultation', // Defaulting since it's not in schema yet
        location: appt.service_address || 'A combinar',
        duration: 60 // Defaulting
      })) || [];

      setAppointments(formattedAppointments);
      setStats(mockStats);
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

  const handleCancelAppointment = async (appointmentId: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('id', appointmentId);

      if (error) throw error;

      loadAppointments();
    } catch (error) {
      console.error('Error cancelling appointment:', error);
    }
  };

  const appointmentColumns = [
    {
      key: 'id',
      title: 'ID',
      render: (value: string) => `#${value.slice(0, 8)}`
    },
    {
      key: 'seller_name',
      title: 'Vendedor',
      render: (value: string) => value || 'N/A'
    },
    {
      key: 'appointment_date',
      title: 'Data/Hora',
      render: (value: string) => {
        const date = new Date(value);
        return (
          <div>
            <div>{date.toLocaleDateString('pt-BR')}</div>
            <div className="text-sm text-muted-foreground">
              {date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        );
      }
    },
    {
      key: 'type',
      title: 'Tipo',
      render: (value: string) => {
        const typeMap = {
          consultation: 'Consulta',
          product_viewing: 'Visualização',
          delivery: 'Entrega',
          meeting: 'Reunião'
        };
        return typeMap[value as keyof typeof typeMap] || value;
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
          {(row.status === 'pending' || row.status === 'confirmed') && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleCancelAppointment(row.id)}
            >
              <XCircle className="h-4 w-4 mr-1" />
              Cancelar
            </Button>
          )}
        </div>
      )
    }
  ];

  const filteredAppointments = appointments.filter(appointment => {
    const matchesStatus = statusFilter === 'all' || appointment.status === statusFilter;
    const matchesSearch = appointment.seller_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  if (!isBuyer) {
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
            Gerencie seus agendamentos com vendedores
          </p>
        </div>
        <Button>
          <Calendar className="h-4 w-4 mr-2" />
          Novo Agendamento
        </Button>
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
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
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
              <Label htmlFor="search">Buscar agendamento</Label>
              <Input
                id="search"
                placeholder="ID do agendamento ou nome do vendedor..."
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
            <DialogTitle>Detalhes do Agendamento #{selectedAppointment?.id.slice(0, 8)}</DialogTitle>
            <DialogDescription>
              Informações completas do agendamento
            </DialogDescription>
          </DialogHeader>

          {selectedAppointment && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label className="text-sm font-medium">Vendedor</Label>
                  <p className="text-sm text-muted-foreground">{selectedAppointment.seller_name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Email</Label>
                  <p className="text-sm text-muted-foreground">{selectedAppointment.seller_email}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Telefone</Label>
                  <p className="text-sm text-muted-foreground">{selectedAppointment.seller_phone}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <Badge className="mt-1">
                    {selectedAppointment.status === 'completed' ? 'Concluído' :
                      selectedAppointment.status === 'confirmed' ? 'Confirmado' :
                        selectedAppointment.status === 'cancelled' ? 'Cancelado' : 'Pendente'}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium">Data</Label>
                  <p className="text-sm text-muted-foreground">
                    {new Date(selectedAppointment.appointment_date).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Horário</Label>
                  <p className="text-sm text-muted-foreground">
                    {new Date(selectedAppointment.appointment_date).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Duração</Label>
                  <p className="text-sm text-muted-foreground">{selectedAppointment.duration} minutos</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Tipo</Label>
                  <p className="text-sm text-muted-foreground">
                    {selectedAppointment.type === 'consultation' ? 'Consulta' :
                      selectedAppointment.type === 'product_viewing' ? 'Visualização' :
                        selectedAppointment.type === 'delivery' ? 'Entrega' : 'Reunião'}
                  </p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Local</Label>
                <p className="text-sm text-muted-foreground">{selectedAppointment.location}</p>
              </div>

              {selectedAppointment.notes && (
                <div>
                  <Label className="text-sm font-medium">Observações</Label>
                  <p className="text-sm text-muted-foreground">{selectedAppointment.notes}</p>
                </div>
              )}

              <div className="border-t pt-4">
                <div className="flex justify-between items-center text-sm text-muted-foreground">
                  <span>Agendado em:</span>
                  <span>{new Date(selectedAppointment.created_at).toLocaleDateString('pt-BR')}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
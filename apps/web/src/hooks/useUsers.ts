
import { useState, useCallback, useEffect } from 'react';
import { userService, UserStats } from '@/services/user.service';
import { UserProfile } from '@/types/auth'; // Import UserProfile
import { toast } from 'sonner';

interface UseUsersOptions {
    fetchOnMount?: boolean;
    role?: UserProfile['role'];
    status?: UserProfile['status'];
}

export function useUsers(options: UseUsersOptions = {}) {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [stats, setStats] = useState<UserStats | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState<UserProfile['role'] | undefined>(options.role);
    const [statusFilter, setStatusFilter] = useState<UserProfile['status'] | undefined>(options.status);

    const fetchUsers = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const { data, error } = await userService.searchUsers(
                searchTerm,
                roleFilter,
                statusFilter
            );

            if (error) throw error;
            setUsers(data);
        } catch (err: any) {
            console.error('Error fetching users:', err);
            setError(err);
            toast.error('Erro ao carregar usuários');
        } finally {
            setLoading(false);
        }
    }, [searchTerm, roleFilter, statusFilter]);

    const fetchStats = useCallback(async () => {
        try {
            const { data, error } = await userService.getUserStats();
            if (error) throw error;
            setStats(data);
        } catch (err: any) {
            console.error('Error fetching user stats:', err);
        }
    }, []);

    const assignRole = useCallback(async (userId: string, role: UserProfile['role']) => {
        if (!role) return;
        try {
            const { error } = await userService.assignRole(userId, role);
            if (error) throw error;

            toast.success(`Função alterada para ${role}`);
            fetchUsers();
        } catch (err: any) {
            console.error('Error assigning role:', err);
            toast.error('Erro ao alterar função');
            throw err;
        }
    }, [fetchUsers]);

    const deleteUser = useCallback(async (userId: string) => {
        try {
            const { error } = await userService.delete(userId);
            if (error) throw error;

            toast.success('Usuário excluído com sucesso');
            fetchUsers();
        } catch (err: any) {
            console.error('Error deleting user:', err);
            toast.error('Erro ao excluir usuário');
            throw err;
        }
    }, [fetchUsers]);

    const approveSeller = useCallback(async (userId: string) => {
        try {
            const { error } = await userService.approveSellerRequest(userId);
            if (error) throw error;

            toast.success('Vendedor aprovado com sucesso');
            fetchUsers(); // Refresh list
        } catch (err: any) {
            console.error('Error approving seller:', err);
            toast.error('Erro ao aprovar vendedor');
            throw err;
        }
    }, [fetchUsers]);

    const rejectSeller = useCallback(async (userId: string) => {
        try {
            const { error } = await userService.rejectSellerRequest(userId);
            if (error) throw error;

            toast.success('Solicitação de vendedor rejeitada');
            fetchUsers();
        } catch (err: any) {
            console.error('Error rejecting seller:', err);
            toast.error('Erro ao rejeitar solicitação');
            throw err;
        }
    }, [fetchUsers]);

    const toggleStatus = useCallback(async (userId: string) => {
        try {
            const { error } = await userService.toggleUserStatus(userId);
            if (error) throw error;

            toast.success('Status do usuário atualizado');
            fetchUsers();
        } catch (err: any) {
            console.error('Error toggling status:', err);
            toast.error('Erro ao atualizar status');
            throw err;
        }
    }, [fetchUsers]);

    useEffect(() => {
        if (options.fetchOnMount) {
            fetchUsers();
            fetchStats();
        }
    }, [fetchUsers, fetchStats, options.fetchOnMount]);

    return {
        users,
        stats,
        loading,
        error,
        filters: {
            search: searchTerm,
            setSearch: setSearchTerm,
            role: roleFilter,
            setRole: setRoleFilter,
            status: statusFilter,
            setStatus: setStatusFilter
        },
        fetchUsers,
        fetchStats,
        approveSeller,
        rejectSeller,
        toggleStatus,
        assignRole,
        deleteUser
    };
}

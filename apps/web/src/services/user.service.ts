import { BaseService } from './base.service';
import { supabase } from '@/integrations/supabase/client';
import { PostgrestError } from '@supabase/supabase-js';
import { UserProfile, UserRole } from '@/types/auth';

export interface UserStats {
  total_users: number;
  active_users: number;
  pending_sellers: number;
  new_users_this_month: number;
  user_growth_percentage: number;
}

class UserService extends BaseService<UserProfile> {
  constructor() {
    super('profiles');
  }

  /**
   * Map database profile to frontend UserProfile
   */
  private mapProfile(profile: any): UserProfile {
    if (!profile) return profile;
    
    // Virtual mapping for 'status' based on 'verified' or 'is_approved'
    // Logic: If verified is true, it's 'active'. Otherwise 'inactive'.
    // If it's a seller and not approved yet, it could be 'pending'.
    let status: UserProfile['status'] = profile.verified ? 'active' : 'inactive';
    
    if (profile.role === 'seller' && profile.is_approved === false) {
      status = 'pending';
    }

    return {
      ...profile,
      status
    };
  }

  /**
   * Get user statistics for admin dashboard
   */
  async getUserStats(): Promise<{ data: UserStats | null; error: PostgrestError | null }> {
    try {
      // Get total users
      const { count: totalUsers, error: totalError } = await this.count();
      if (totalError) throw totalError;

      // Get active users
      // Map 'status: active' to 'verified: true' for compatibility
      const { count: activeUsers, error: activeError } = await this.count({ verified: true });
      if (activeError) throw activeError;

      // Get pending sellers
      // Note: Using 'is_approved' or 'role' combined with other flags if status is missing
      const { count: pendingSellers, error: pendingError } = await this.count({
        role: 'seller',
        is_approved: false
      });
      if (pendingError) throw pendingError;

      // Get new users this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data: newUsersData, error: newUsersError } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', startOfMonth.toISOString());

      if (newUsersError) throw newUsersError;

      // Calculate growth percentage (compared to last month)
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      lastMonth.setDate(1);
      lastMonth.setHours(0, 0, 0, 0);

      const { data: lastMonthData, error: lastMonthError } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', lastMonth.toISOString())
        .lt('created_at', startOfMonth.toISOString());

      if (lastMonthError) throw lastMonthError;

      const newUsersThisMonth = newUsersData?.length || 0;
      const newUsersLastMonth = lastMonthData?.length || 0;
      const growthPercentage = newUsersLastMonth > 0
        ? ((newUsersThisMonth - newUsersLastMonth) / newUsersLastMonth) * 100
        : 0;

      const stats: UserStats = {
        total_users: totalUsers,
        active_users: activeUsers,
        pending_sellers: pendingSellers,
        new_users_this_month: newUsersThisMonth,
        user_growth_percentage: Math.round(growthPercentage * 100) / 100
      };

      return { data: stats, error: null };
    } catch (error) {
      console.error('Error getting user stats:', error);
      return { data: null, error: error as PostgrestError };
    }
  }

  /**
   * Get users by role
   */
  async getUsersByRole(role: UserRole): Promise<{ data: UserProfile[]; error: PostgrestError | null }> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*, user_roles(role)')
        .eq('role', role)
        .order('created_at', { ascending: false });

      return {
        data: (data || []).map(p => this.mapProfile(p)),
        error
      };
    } catch (error) {
      console.error('Error getting users by role:', error);
      return {
        data: [],
        error: error as PostgrestError
      };
    }
  }

  /**
   * Get pending seller requests
   */
  async getPendingSellerRequests(): Promise<{ data: UserProfile[]; error: PostgrestError | null }> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*, user_roles(role)')
        .eq('role', 'seller')
        .eq('is_approved', false)
        .order('created_at', { ascending: false });

      return {
        data: (data || []).map(p => this.mapProfile(p)),
        error
      };
    } catch (error) {
      console.error('Error getting pending seller requests:', error);
      return {
        data: [],
        error: error as PostgrestError
      };
    }
  }

  /**
   * Approve seller request
   */
  async approveSellerRequest(userId: string): Promise<{ data: UserProfile | null; error: PostgrestError | null }> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          status: 'active',
          seller_approved: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      return {
        data: data as UserProfile,
        error
      };
    } catch (error) {
      console.error('Error approving seller request:', error);
      return {
        data: null,
        error: error as PostgrestError
      };
    }
  }

  /**
   * Reject seller request
   */
  async rejectSellerRequest(userId: string): Promise<{ data: UserProfile | null; error: PostgrestError | null }> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          role: 'buyer',
          status: 'active',
          seller_approved: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      // Also remove from user_roles if exists
      await supabase.from('user_roles').delete().eq('user_id', userId).eq('role', 'seller');

      return {
        data: data as UserProfile,
        error
      };
    } catch (error) {
      console.error('Error rejecting seller request:', error);
      return {
        data: null,
        error: error as PostgrestError
      };
    }
  }

  /**
   * Toggle user status
   */
  async toggleUserStatus(userId: string): Promise<{ data: UserProfile | null; error: PostgrestError | null }> {
    try {
      // First get current status (verified column)
      const { data: currentUser, error: fetchError } = await this.getById(userId);
      if (fetchError || !currentUser) {
        return { data: null, error: fetchError };
      }

      // Toggle 'verified' column
      const newStatus = !(currentUser as any).verified;

      const { data, error } = await supabase
        .from('profiles')
        .update({
          verified: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      return {
        data: this.mapProfile(data),
        error
      };
    } catch (error) {
      console.error('Error toggling user status:', error);
      return {
        data: null,
        error: error as PostgrestError
      };
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(
    userId: string,
    profileData: Partial<UserProfile>
  ): Promise<{ data: UserProfile | null; error: PostgrestError | null }> {
    // 🛡️ SECURITY/COMPATIBILITY: The 'status' column doesn't exist in the actual DB table.
    // We remove it here to avoid PostgrestError (PGRST204)
    const { status, roles, ...validData } = profileData as any;
    
    // If status is provided, we could map it to 'verified' if that's the intent
    if (status !== undefined) {
      (validData as any).verified = status === 'active';
    }

    return this.update(userId, validData);
  }

  /**
   * Update last login timestamp
   */
  async updateLastLogin(userId: string): Promise<{ error: PostgrestError | null }> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          last_login: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      return { error };
    } catch (error) {
      console.error('Error updating last login:', error);
      return { error: error as PostgrestError };
    }
  }

  /**
   * Search users
   */
  async searchUsers(
    searchTerm: string,
    role?: UserRole,
    status?: UserProfile['status']
  ): Promise<{ data: UserProfile[]; error: PostgrestError | null }> {
    try {
      let query = supabase
        .from('profiles')
        .select('*, user_roles(role)');

      // Apply search term
      if (searchTerm) {
        query = query.or(`full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
      }

      // Apply filters
      if (role) {
        query = query.eq('role', role);
      }

      if (status) {
        // Map frontend status filter to DB columns
        if (status === 'active') {
          query = query.eq('verified', true);
        } else if (status === 'inactive') {
          query = query.eq('verified', false);
        } else if (status === 'pending') {
          query = query.eq('is_approved', false).eq('role', 'seller');
        }
      }

      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      return {
        data: (data || []).map(p => this.mapProfile(p)),
        error
      };
    } catch (error) {
      console.error('Error searching users:', error);
      return {
        data: [],
        error: error as PostgrestError
      };
    }
  }

  /**
   * Get user activity summary
   */
  async getUserActivity(userId: string): Promise<{ data: any; error: PostgrestError | null }> {
    try {
      const { data: user, error: userError } = await this.getById(userId);
      if (userError || !user) {
        return { data: null, error: userError };
      }

      const activity = {
        user,
        recent_activity: [],
        stats: {
          total_orders: 0,
          total_products: 0,
          total_sales: 0,
          last_activity: user.last_login
        }
      };

      return { data: activity, error: null };
    } catch (error) {
      console.error('Error getting user activity:', error);
      return { data: null, error: error as PostgrestError };
    }
  }

  /**
   * Promote or demote user by email
   */
  async updateRoleByEmail(email: string, role: UserRole): Promise<{ data: UserProfile | null; error: any }> {
    try {
      // 1. Find user by email
      const { data: user, error: findError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      if (findError) throw findError;
      if (!user) throw new Error('Usuário com este e-mail não encontrado.');

      // 2. Call assignRole
      return await this.assignRole(user.id, role);
    } catch (error: any) {
      console.error('[UserService] Error updating role by email:', error.message);
      return { data: null, error };
    }
  }

  /**
   * Assign role to user
   */
  async assignRole(userId: string, role: UserRole): Promise<{ data: UserProfile | null; error: PostgrestError | null }> {
    try {
      // 1. Update user_roles table
      if (role === 'seller' || role === 'admin') {
        // upsert
        const { error: roleError } = await supabase
          .from('user_roles')
          .upsert({ user_id: userId, role: role }, { onConflict: 'user_id,role' });
        if (roleError) throw roleError;
      } else {
        // If downgrading to buyer, remove other roles? 
        // Strategy: 'buyer' is default if no other role.
        // But let's just remove specific roles if we are "setting" to buyer.
        // Actually, simpler: 
        // If assigning 'seller', add 'seller'.
        // If assigning 'buyer', remove 'seller' and 'admin'.
        if (role === 'buyer') {
          await supabase.from('user_roles').delete().eq('user_id', userId).in('role', ['seller', 'admin']);
        }
      }

      // 2. Update profile 'role' column for legacy/cache compatibility
      const { data, error } = await supabase
        .from('profiles')
        .update({
          role: role,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      return { data: data as UserProfile, error };
    } catch (error) {
      console.error('Error assigning role:', error);
      return { data: null, error: error as PostgrestError };
    }
  }

  /**
   * Bulk update users
   */
  async bulkUpdateUsers(
    userIds: string[],
    updateData: Partial<Pick<UserProfile, 'status' | 'role'>>
  ): Promise<{ data: UserProfile[] | null; error: PostgrestError | null }> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .in('id', userIds)
        .select();

      return {
        data: data as UserProfile[],
        error
      };
    } catch (error) {
      console.error('Error bulk updating users:', error);
      return {
        data: null,
        error: error as PostgrestError
      };
    }
  }

  /**
   * Ações de admin que precisam da service role (edge function `admin-users`).
   */
  async adminAction<T = any>(body: Record<string, unknown>): Promise<{ data: T | null; error: string | null }> {
    const { data, error } = await supabase.functions.invoke('admin-users', { body })

    if (error) {
      // A function devolve `{ error, message }`; o client embrulha em FunctionsHttpError.
      let message = error.message
      try {
        const context = await (error as any).context?.json?.()
        if (context?.message) message = context.message
      } catch {
        // sem corpo legível — mantém a mensagem padrão
      }
      return { data: (data as T) ?? null, error: message }
    }

    if (data?.error) {
      return { data: data as T, error: data.message || data.error }
    }

    return { data: data as T, error: null }
  }

  /** Remove o usuário; `cascade` apaga também produtos/embalagens do vendedor. */
  async adminDeleteUser(userId: string, cascade = false) {
    return this.adminAction({ action: 'delete', userId, cascade })
  }

  /** Conta o que está vinculado ao usuário antes de excluir. */
  async adminPreviewDelete(userId: string) {
    return this.adminAction<{
      products: number
      ordersAsSeller: number
      ordersAsBuyer: number
      coupons: number
      giftWraps: number
      reviews: number
      requiresConfirmation: boolean
    }>({ action: 'preview-delete', userId })
  }

  /** Troca e-mail e/ou senha de um usuário. */
  async adminSetCredentials(userId: string, credentials: { email?: string; password?: string }) {
    return this.adminAction<{ ok: boolean; email: string | null }>({
      action: 'set-credentials',
      userId,
      ...credentials,
    })
  }
}

export const userService = new UserService();

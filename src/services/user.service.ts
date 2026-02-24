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
   * Get user statistics for admin dashboard
   */
  async getUserStats(): Promise<{ data: UserStats | null; error: PostgrestError | null }> {
    try {
      // Get total users
      const { count: totalUsers, error: totalError } = await this.count();
      if (totalError) throw totalError;

      // Get active users
      const { count: activeUsers, error: activeError } = await this.count({ status: 'active' });
      if (activeError) throw activeError;

      // Get pending sellers
      // Note: 'role' might be in 'user_roles' table, but we use the denormalized/profile column for quick stats if available.
      // If not, we should query user_roles.
      // Assuming 'role' column on profiles exists for now based on previous code.
      const { count: pendingSellers, error: pendingError } = await this.count({
        role: 'seller',
        status: 'pending'
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
        data: data as unknown as UserProfile[] || [],
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
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      return {
        data: data as unknown as UserProfile[] || [],
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
      // First get current status
      const { data: currentUser, error: fetchError } = await this.getById(userId);
      if (fetchError || !currentUser) {
        return { data: null, error: fetchError };
      }

      const newStatus = currentUser.status === 'active' ? 'inactive' : 'active';

      const { data, error } = await supabase
        .from('profiles')
        .update({
          status: newStatus,
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
    return this.update(userId, profileData);
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
        // If 'role' is a column on profiles, this works.
        // If not, we might need to filter manually or use a different query strategy.
        // Assuming 'role' column exists for now.
        query = query.eq('role', role);
      }

      if (status) {
        query = query.eq('status', status);
      }

      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      return {
        data: data as unknown as UserProfile[] || [],
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
}

export const userService = new UserService();
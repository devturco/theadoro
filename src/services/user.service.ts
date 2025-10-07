import { BaseService, BaseEntity } from './base.service';
import { supabase } from '@/integrations/supabase/client';
import { PostgrestError } from '@supabase/supabase-js';

export interface User extends BaseEntity {
  email: string;
  full_name: string;
  avatar_url?: string;
  phone?: string;
  role: 'admin' | 'seller' | 'buyer';
  status: 'active' | 'inactive' | 'pending';
  seller_approved?: boolean;
  seller_documents?: string[];
  address?: {
    street: string;
    city: string;
    state: string;
    zip_code: string;
    country: string;
  };
  preferences?: {
    notifications: boolean;
    marketing_emails: boolean;
    theme: 'light' | 'dark';
  };
  last_login?: string;
}

export interface UserStats {
  total_users: number;
  active_users: number;
  pending_sellers: number;
  new_users_this_month: number;
  user_growth_percentage: number;
}

class UserService extends BaseService<User> {
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
        .from(this.tableName)
        .select('id', { count: 'exact', head: true })
        .gte('created_at', startOfMonth.toISOString());

      if (newUsersError) throw newUsersError;

      // Calculate growth percentage (compared to last month)
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      lastMonth.setDate(1);
      lastMonth.setHours(0, 0, 0, 0);

      const { data: lastMonthData, error: lastMonthError } = await supabase
        .from(this.tableName)
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
  async getUsersByRole(role: User['role']): Promise<{ data: User[]; error: PostgrestError | null }> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('role', role)
        .order('created_at', { ascending: false });

      return {
        data: data as User[] || [],
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
  async getPendingSellerRequests(): Promise<{ data: User[]; error: PostgrestError | null }> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('role', 'seller')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      return {
        data: data as User[] || [],
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
  async approveSellerRequest(userId: string): Promise<{ data: User | null; error: PostgrestError | null }> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .update({
          status: 'active',
          seller_approved: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      return {
        data: data as User,
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
  async rejectSellerRequest(userId: string): Promise<{ data: User | null; error: PostgrestError | null }> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .update({
          role: 'buyer',
          status: 'active',
          seller_approved: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      return {
        data: data as User,
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
  async toggleUserStatus(userId: string): Promise<{ data: User | null; error: PostgrestError | null }> {
    try {
      // First get current status
      const { data: currentUser, error: fetchError } = await this.getById(userId);
      if (fetchError || !currentUser) {
        return { data: null, error: fetchError };
      }

      const newStatus = currentUser.status === 'active' ? 'inactive' : 'active';

      const { data, error } = await supabase
        .from(this.tableName)
        .update({
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      return {
        data: data as User,
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
    profileData: Partial<Pick<User, 'full_name' | 'phone' | 'avatar_url' | 'address' | 'preferences'>>
  ): Promise<{ data: User | null; error: PostgrestError | null }> {
    return this.update(userId, profileData);
  }

  /**
   * Update last login timestamp
   */
  async updateLastLogin(userId: string): Promise<{ error: PostgrestError | null }> {
    try {
      const { error } = await supabase
        .from(this.tableName)
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
    role?: User['role'],
    status?: User['status']
  ): Promise<{ data: User[]; error: PostgrestError | null }> {
    try {
      let query = supabase
        .from(this.tableName)
        .select('*');

      // Apply search term
      if (searchTerm) {
        query = query.or(`full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
      }

      // Apply filters
      if (role) {
        query = query.eq('role', role);
      }

      if (status) {
        query = query.eq('status', status);
      }

      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      return {
        data: data as User[] || [],
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
      // This would typically involve joining with other tables
      // For now, we'll return basic user info
      const { data: user, error: userError } = await this.getById(userId);
      if (userError || !user) {
        return { data: null, error: userError };
      }

      // In a real implementation, you'd fetch:
      // - Recent orders (if buyer)
      // - Recent products/sales (if seller)
      // - Login history
      // - Activity logs

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
   * Bulk update users
   */
  async bulkUpdateUsers(
    userIds: string[],
    updateData: Partial<Pick<User, 'status' | 'role'>>
  ): Promise<{ data: User[] | null; error: PostgrestError | null }> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .in('id', userIds)
        .select();

      return {
        data: data as User[],
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
export interface User {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  bio: string | null;
  city: string | null;
  state: string | null;
  address: string | null;
  postal_code: string | null;
  created_at: string;
  updated_at: string;
  roles?: UserRole[];
  is_approved?: boolean;
  last_login?: string;
}

export interface UserStats {
  total_users: number;
  active_users: number;
  pending_sellers: number;
  total_buyers: number;
  total_sellers: number;
  total_admins: number;
  new_users_this_month: number;
  user_growth_rate: number;
}

export interface UserFilters {
  search?: string;
  role?: UserRole;
  is_approved?: boolean;
  city?: string;
  state?: string;
  created_from?: string;
  created_to?: string;
  last_login_from?: string;
  last_login_to?: string;
}

export interface CreateUserData {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
  role: UserRole;
  city?: string;
  state?: string;
  address?: string;
  postal_code?: string;
  bio?: string;
}

export interface UpdateUserData {
  full_name?: string;
  phone?: string;
  avatar_url?: string;
  bio?: string;
  city?: string;
  state?: string;
  address?: string;
  postal_code?: string;
  is_approved?: boolean;
}

export interface UserActivity {
  id: string;
  user_id: string;
  action: string;
  description: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface UserSession {
  id: string;
  user_id: string;
  session_token: string;
  ip_address: string;
  user_agent: string;
  created_at: string;
  expires_at: string;
  is_active: boolean;
}

import type { UserRole } from './auth';
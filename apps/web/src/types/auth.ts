import { Profiles } from '@theadoro/api-client';

export type UserRole = 'admin' | 'seller' | 'buyer';

export interface AuthUser {
  id: string;
  email: string;
  user_metadata: {
    full_name?: string;
    avatar_url?: string;
  };
}

export interface UserProfile extends Profiles {
  // Virtual UI fields
  status?: 'active' | 'inactive' | 'pending';
  
  // Relations
  roles?: UserRole[]; 

  // Legacy/Compatibility fields if not in Profiles yet
  country?: string | null;
  preferences?: {
    notifications?: boolean;
    marketing_emails?: boolean;
    theme?: 'light' | 'dark';
    [key: string]: any;
  };
  last_login?: string;
  seller_documents?: string[];
  seller_approved?: boolean;
}

export interface UserRoleRecord {
  id: string;
  user_id: string;
  role: UserRole;
  created_at: string;
}

export interface AuthContextType {
  user: AuthUser | null;
  profile: UserProfile | null;
  roles: UserRole[];
  loading: boolean;
  signUp: (email: string, password: string, metadata?: any) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  refreshSession: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  dbRoles: UserRole[];
}

export interface RolePermissions {
  canManageUsers: boolean;
  canManageProducts: boolean;
  canManageOrders: boolean;
  canViewReports: boolean;
  canModerateContent: boolean;
  canManageCategories: boolean;
}
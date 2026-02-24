export type UserRole = 'admin' | 'seller' | 'buyer';

export interface AuthUser {
  id: string;
  email: string;
  user_metadata: {
    full_name?: string;
    avatar_url?: string;
  };
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  bio: string | null;

  // Address fields (Flat structure matches DB usually)
  address: string | null; // Street
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country?: string | null;

  created_at: string;
  updated_at: string;

  // Role & Status
  role?: UserRole; // From profile column (legacy/cache)
  roles?: UserRole[]; // From user_roles relation
  status?: 'active' | 'inactive' | 'pending';
  seller_approved?: boolean;

  // JSONB fields
  preferences?: {
    notifications?: boolean;
    marketing_emails?: boolean;
    theme?: 'light' | 'dark';
    [key: string]: any;
  };

  last_login?: string;
  seller_documents?: string[];
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
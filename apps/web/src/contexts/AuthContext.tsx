
import { createContext, useContext, useEffect, useState, useCallback, ReactNode, useMemo } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { AuthUser, UserProfile, UserRole, AuthContextType } from '@/types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Derive roles directly from profile AND user_roles table
  const [dbRoles, setDbRoles] = useState<UserRole[]>(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('auth_db_roles');
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch (e) {
          return [];
        }
      }
    }
    return [];
  });

  const roles: UserRole[] = useMemo(() => {
    const r = new Set<UserRole>();
    if (profile?.role) r.add(profile.role);
    dbRoles.forEach(role => r.add(role));

    // Admins get everything
    if (r.has('admin')) {
      r.add('seller');
      r.add('buyer');
    }

    // Default fallback
    if (r.size === 0) r.add('buyer');

    return Array.from(r);
  }, [profile?.role, dbRoles]);

  // Fetch user profile (Single Source of Truth)
  const fetchProfile = useCallback(async (userId: string) => {
    // normal fetch flow...






    // 🚀 ASYNC FETCH: Both happen in background and update state when ready

    // Roles fetch (Priority 1)
    const fetchRoles = async () => {
      try {
        const { data } = await supabase.from('user_roles').select('role').eq('user_id', userId);
        if (data && data.length > 0) {
          const rolesArray = data.map((r: any) => r.role as UserRole);
          setDbRoles(rolesArray);
          localStorage.setItem('auth_db_roles', JSON.stringify(rolesArray));
        }
      } catch (e: any) {
        console.error('[AuthContext] Roles fetch failed:', e.message);
      }
    };

    fetchRoles();

    // Profile fetch (Priority 2)
    const fetchProfileTask = async () => {
      try {
        let { data, error }: any = await (supabase.rpc as any)('get_profile_explicit', { target_id: userId }).maybeSingle();
        if (error) {
          const result = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
          data = result.data;
        }
        if (data) setProfile(data as UserProfile);
      } catch (e: any) {
        console.warn('[AuthContext] Profile fetch ignored during timeout/fail:', e.message);
      } finally {
      }
    };

    fetchProfileTask();
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user?.id) {
      await fetchProfile(user.id);
    }
  }, [user?.id, fetchProfile]);

  // Listen to auth changes
  useEffect(() => {
    let mounted = true;

    // Safety timeout - IF we have roles, we can unblock loading even if profile is slow
    const safetyTimeout = setTimeout(() => {
      if (mounted && loading) {
        setLoading(false);
      }
    }, 3000); // Reduced to 3s for better UX

    // Initial Load
    const initAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) throw error;

        if (mounted) {
          if (session?.user) {
            setUser(session.user as AuthUser);
            // Fetch profile and roles in background, don't wait for them to unblock UI if we already have session
            fetchProfile(session.user.id);
          } else {
            setUser(null);
            setProfile(null);
          }
        }
      } catch (error) {
        console.error('[AuthContext] Auth init error:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initAuth();

    // Realtime Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        if (session?.user) {
          setUser(session.user as AuthUser);
          if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
            await fetchProfile(session.user.id);
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  // Sign up
  const signUp = useCallback(async (
    email: string,
    password: string,
    metadata?: any
  ) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    });

    if (error) throw error;

    toast.success('Conta criada! Verifique seu email para confirmar.');
  }, []);

  // Sign in
  const signIn = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    toast.success('Login realizado com sucesso!');
  }, []);

  // Sign out
  const signOut = useCallback(async () => {

    // Internal helper to clear auth state
    const performLocalCleanup = () => {
      // 1. Reset Context State
      setUser(null);
      setProfile(null);
      setDbRoles([]);
      
      // 2. Remove Auth Specific Keys
      localStorage.removeItem('auth_db_roles');
      localStorage.removeItem('checkoutFormData');
      localStorage.removeItem('checkoutStep');
      
      // 3. Selective LocalStorage Clear (Keep global settings, but remove user specific data)
      // Note: We clean everything starting with 'theadoro-cart-' to ensure NO LEAKAGE between users
      Object.keys(localStorage).forEach(key => {
        if (
          key.includes('supabase.auth.token') || 
          key.startsWith('sb-') || 
          key.startsWith('theadoro-cart-')
        ) {
          localStorage.removeItem(key);
        }
      });

      sessionStorage.clear();
      console.log('[AuthContext] Isolated user data cleared');
      toast.success('Sessão encerrada com segurança.');
    };

    try {
      // Race the Supabase call against a 2s timeout
      const signOutTask = supabase.auth.signOut();
      const timeoutTask = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('SignOut Network Timeout')), 2000)
      );

      await Promise.race([signOutTask, timeoutTask]);
    } catch (e: any) {
      console.warn('[AuthContext] SignOut Supabase call failed or timed out:', e.message);
    } finally {
      performLocalCleanup();
    }
  }, []);

  // Update profile
  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    if (!user) throw new Error('Usuário não autenticado');

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw error;

    setProfile(data);
    toast.success('Perfil atualizado com sucesso!');
  }, [user]);

  // Reset password
  const resetPassword = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) throw error;

    toast.success('Email de recuperação enviado!');
  }, []);

  // Update password
  const updatePassword = useCallback(async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });

    if (error) throw error;

    toast.success('Senha atualizada com sucesso!');
  }, []);

  // Refresh session
  const refreshSession = useCallback(async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) throw error;
    } catch (error) {
      console.error('[AuthContext] Refresh session error:', error);
    }
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      roles,
      loading,
      signUp,
      signIn,
      signOut,
      updateProfile,
      resetPassword,
      updatePassword,
      refreshSession,
      refreshProfile,
      dbRoles // Expose this for low-level checks if needed
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// Emergency Logout Helper (can be used via console if UI is totally stuck)
if (typeof window !== 'undefined') {
  (window as any).__logout = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = '/auth';
  };
}

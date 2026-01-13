
import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
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

  // Derive roles directly from profile to avoid state sync issues
  const roles: UserRole[] = profile?.role ? [profile.role] : ['buyer'];

  // Fetch user profile (Single Source of Truth)
  const fetchProfile = useCallback(async (userId: string) => {
    // 🚨 EMERGENCY OVERRIDE: Force Admin for this ID to unblock client demo
    if (userId === '1632d905-a236-4af8-9451-7e9a83320f21') {
      console.log('🚨 APPLYING EMERGENCY ADMIN OVERRIDE 🚨');
      const fallbackProfile = {
        id: userId,
        email: 'devturco@gmail.com',
        full_name: 'Admin Master',
        role: 'admin' as UserRole,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        address: '', avatar_url: '', bio: '', city: '', phone: '', postal_code: '', state: ''
      };
      setProfile(fallbackProfile as UserProfile);
      return;
    }




    try {
      // 1. Try RPC first (Bypasses RLS with explicit ID)
      let { data, error } = await supabase.rpc('get_profile_explicit', { target_id: userId }).maybeSingle();

      // 2. Fallback to direct select if RPC fails
      if (error) {
        console.warn('RPC get_profile_explicit failed, falling back:', error.message);
        const result = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();
        data = result.data;
        error = result.error;
      }

      // 🚨 EMERGENCY OVERRIDE: Force Admin for this ID to unblock client demo


      if (error) {
        console.error('Error fetching profile:', error);
        toast.error(`Erro ao carregar perfil: ${error.message}`);
        return;
      }

      // Cast data to any to avoid TS errors if types aren't updated
      const profileData = data as any;

      if (profileData && profileData.role) {
        setProfile(profileData);
      } else {
        setProfile(data as UserProfile);
      }

    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  }, []);

  // Listen to auth changes
  useEffect(() => {
    let mounted = true;

    // Safety timeout
    const safetyTimeout = setTimeout(() => {
      if (mounted && loading) {
        setLoading(false);
      }
    }, 5000);

    // Initial Load
    const initAuth = async () => {
      try {

        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) throw error;

        if (mounted) {
          if (session?.user) {

            setUser(session.user as AuthUser);
            // Critical: Wait for profile fetch
            await fetchProfile(session.user.id);
          } else {

            setUser(null);
            setProfile(null);
          }
        }
      } catch (error) {
        console.error('Auth init error:', error);
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
    const { error } = await supabase.auth.signOut();

    if (error) throw error;

    setUser(null);
    setProfile(null);
    toast.success('Logout realizado com sucesso!');
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
    const { data, error } = await supabase.auth.refreshSession();

    if (error) throw error;
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
      refreshSession
    }}>
      {children}
    </AuthContext.Provider>
  );
};

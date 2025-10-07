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
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch user profile
  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
        return;
      }

      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  }, []);

  // Fetch user roles
  const fetchRoles = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching roles:', error);
        return;
      }

      const userRoles = data.map(item => item.role as UserRole);
      setRoles(userRoles);
    } catch (error) {
      console.error('Error fetching roles:', error);
      setRoles([]);
    }
  }, []);

  // Listen to auth changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setLoading(true);
        
        if (session?.user) {
          setUser(session.user as AuthUser);
          await Promise.all([
            fetchProfile(session.user.id),
            fetchRoles(session.user.id)
          ]);
        } else {
          setUser(null);
          setProfile(null);
          setRoles([]);
        }
        
        setLoading(false);
      }
    );

    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user as AuthUser);
        await Promise.all([
          fetchProfile(session.user.id),
          fetchRoles(session.user.id)
        ]);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile, fetchRoles]);

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
    setRoles([]);
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

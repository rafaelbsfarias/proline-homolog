// modules/common/services/AuthProvider.tsx
'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, AuthChangeEvent, Session } from '@supabase/supabase-js';
import { SupabaseService } from './SupabaseService';
import { authService } from './AuthService'; // Correct import

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  signUp: (
    email: string,
    password: string,
    userData: any
  ) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = SupabaseService.getInstance().getClient();

    // Single responsibility: apenas gerenciar auth state
    const initializeAuth = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setUser(user);
      } catch (error) {
        console.error('Auth initialization error:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Clean auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription?.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    const supabase = SupabaseService.getInstance().getClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) return { success: false, error: error.message };

    setUser(data.user);
    return { success: true };
  };

  const logout = async () => {
    const supabase = SupabaseService.getInstance().getClient();
    await supabase.auth.signOut();
    setUser(null);
  };

  const signUp = async (email: string, password: string, userData: any) => {
    const supabase = SupabaseService.getInstance().getClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: userData },
    });

    return error ? { success: false, error: error.message } : { success: true };
  };

  const resetPassword = async (email: string) => {
    return await authService.resetPassword(email);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        signUp,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

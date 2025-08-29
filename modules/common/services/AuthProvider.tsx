// modules/common/services/AuthProvider.tsx
'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef, // Import useRef
  ReactNode,
} from 'react';
import { User, AuthChangeEvent, Session } from '@supabase/supabase-js';
import { SupabaseService } from './SupabaseService';
import { authService } from './AuthService'; // Correct import
import { useRouter, usePathname } from 'next/navigation';
import { RouteProtector } from '../components/RouteProtector/ProtectedRoute';
import { getErrorMessageFromRaw } from '@/modules/common/constants/messages';

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

const PUBLIC_PATHS = ['/login', '/cadastro', '/recuperar-senha', '/confirm-email'];

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const userRef = useRef(user);
  userRef.current = user;

  useEffect(() => {
    const supabase = SupabaseService.getInstance().getClient();

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

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session && userRef.current !== null) {
        setUser(null);
        router.push('/login'); // 🔑 aqui redireciona o usuário
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkSession();
      }
    };

    window.addEventListener('focus', checkSession);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      subscription?.unsubscribe();
      window.removeEventListener('focus', checkSession);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [router]);

  const login = async (email: string, password: string) => {
    const supabase = SupabaseService.getInstance().getClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) return { success: false, error: getErrorMessageFromRaw(error.message) };

    setUser(data.user);
    return { success: true };
  };

  const logout = async () => {
    const supabase = SupabaseService.getInstance().getClient();
    await supabase.auth.signOut();
    setUser(null);
    router.push('/login');
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
      <RouteProtector>{children}</RouteProtector>
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

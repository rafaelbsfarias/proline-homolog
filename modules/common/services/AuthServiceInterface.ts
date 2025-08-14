import { User } from '@supabase/supabase-js';

export interface AuthResult {
  success: boolean;
  user?: User;
  error?: string;
  type?: 'auth' | 'profile' | 'system';
}

export interface AuthServiceInterface {
  login(email: string, password: string): Promise<AuthResult>;
  signUp(email: string, password: string): Promise<AuthResult>;
  logout(): Promise<{ success: boolean; error?: string }>;
  getCurrentUserProfile?(): Promise<any>;
  resetPassword(email: string): Promise<{ success: boolean; error?: string }>;
  updatePassword(newPassword: string): Promise<{ success: boolean; error?: string }>;
}

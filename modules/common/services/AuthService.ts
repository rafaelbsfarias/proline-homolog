import { SupabaseService } from './SupabaseService';
import { AuthServiceInterface, AuthResult } from './AuthServiceInterface';
import { ErrorHandlerService, ErrorType } from './ErrorHandlerService';
import { AUTH_MESSAGES, SYSTEM_MESSAGES } from '../constants/messages';
import { User } from '@supabase/supabase-js';

/**
 * Service layer para autenticação com Supabase
 * Implementa o padrão Service Layer e Single Responsibility Principle
 *
 * Responsabilidades:
 * - Gerenciar autenticação de usuários
 * - Abstrair complexidade do Supabase
 * - Fornecer interface consistente
 * - Tratar erros de forma padronizada
 */
export class AuthService implements AuthServiceInterface {
  private supabaseService: SupabaseService;
  private errorHandler: ErrorHandlerService;

  constructor() {
    this.supabaseService = SupabaseService.getInstance();
    this.errorHandler = ErrorHandlerService.getInstance();
  }

  /**
   * Realiza login do usuário
   */
  async login(email: string, password: string): Promise<AuthResult> {
    try {
      const client = this.supabaseService.getClient();
      const { data, error } = await client.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        this.errorHandler.handleError(error, ErrorType.AUTHENTICATION, {
          showToUser: false,
          context: { email: email.trim().toLowerCase() },
        });
        return {
          success: false,
          error: this.mapAuthError(error.message),
          type: 'auth',
        };
      }

      if (!data.user) {
        return {
          success: false,
          error: AUTH_MESSAGES.LOGIN_ERROR,
          type: 'auth',
        };
      }

      return {
        success: true,
        user: data.user,
      };
    } catch (error) {
      this.errorHandler.handleError(error as Error, ErrorType.SERVER, {
        showToUser: false,
        context: { action: 'login', email: email.trim().toLowerCase() },
      });
      return {
        success: false,
        error: SYSTEM_MESSAGES.INTERNAL_ERROR,
        type: 'system',
      };
    }
  }

  /**
   * Registra novo usuário
   */
  async signUp(email: string, password: string): Promise<AuthResult> {
    try {
      const client = this.supabaseService.getClient();
      const { data, error } = await client.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        this.errorHandler.handleError(error, ErrorType.AUTHENTICATION, {
          showToUser: false,
          context: { email: email.trim().toLowerCase() },
        });
        return {
          success: false,
          error: this.mapAuthError(error.message),
          type: 'auth',
        };
      }

      if (!data.user) {
        return {
          success: false,
          error: AUTH_MESSAGES.SIGNUP_ERROR,
          type: 'auth',
        };
      }

      return {
        success: true,
        user: data.user,
      };
    } catch (error) {
      this.errorHandler.handleError(error as Error, ErrorType.SERVER, {
        showToUser: false,
        context: { action: 'signup', email: email.trim().toLowerCase() },
      });
      return {
        success: false,
        error: SYSTEM_MESSAGES.INTERNAL_ERROR,
        type: 'system',
      };
    }
  }

  /**
   * Realiza logout do usuário
   */
  async logout(): Promise<{ success: boolean; error?: string }> {
    try {
      const client = this.supabaseService.getClient();
      const { error } = await client.auth.signOut();

      if (error) {
        return {
          success: false,
          error: 'Erro ao fazer logout',
        };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: 'Erro interno do sistema',
      };
    }
  }

  /**
   * Solicita reset de senha por email
   */
  async resetPassword(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      const client = this.supabaseService.getClient();
      const redirectTo = this.getResetPasswordUrl();

      const { error } = await client.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo,
      });

      if (error) {
        return {
          success: false,
          error: 'Erro ao enviar email de recuperação',
        };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: 'Erro interno do sistema',
      };
    }
  }

  /**
   * Atualiza a senha do usuário logado
   */
  async updatePassword(newPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
      const client = this.supabaseService.getClient();
      const { error } = await client.auth.updateUser({ password: newPassword });

      if (error) {
        this.errorHandler.handleError(error, ErrorType.AUTHENTICATION, {
          showToUser: false,
          context: { action: 'updatePassword' },
        });
        return {
          success: false,
          error: this.mapAuthError(error.message), // Reutiliza o mapeamento de erros
        };
      }

      return { success: true };
    } catch (error) {
      this.errorHandler.handleError(error as Error, ErrorType.SERVER, {
        showToUser: false,
        context: { action: 'updatePassword' },
      });
      return {
        success: false,
        error: SYSTEM_MESSAGES.INTERNAL_ERROR,
      };
    }
  }

  async getCurrentUser(): Promise<{ data: { user: User | null }; error: any }> {
    try {
      const client = this.supabaseService.getClient();
      return await client.auth.getUser();
    } catch (error) {
      return {
        data: { user: null },
        error: { message: 'Erro ao obter usuário atual' },
      };
    }
  }

  async getCurrentUserProfile(): Promise<any> {
    return null;
  }

  private mapAuthError(errorMessage: string): string {
    const errorMap: Record<string, string> = {
      'Invalid login credentials': AUTH_MESSAGES.LOGIN_ERROR,
      'User already registered': AUTH_MESSAGES.USER_ALREADY_EXISTS,
      'Password should be at least 6 characters': AUTH_MESSAGES.WEAK_PASSWORD,
      'Signup requires a valid password': AUTH_MESSAGES.WEAK_PASSWORD,
      'Unable to validate email address': AUTH_MESSAGES.INVALID_EMAIL,
      'Email rate limit exceeded': 'Muitas tentativas. Tente novamente em alguns minutos.',
    };

    return errorMap[errorMessage] || AUTH_MESSAGES.LOGIN_ERROR;
  }

  private getResetPasswordUrl(): string {
    if (typeof window === 'undefined') {
      return 'https://portal.prolineauto.com.br/reset-password';
    }

    return `${window.location.origin}/reset-password`;
  }
}

export const authService = new AuthService();

export const useAuthService = () => authService;

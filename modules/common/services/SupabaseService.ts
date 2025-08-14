import { createClient } from '@supabase/supabase-js';

/**
 * Configuração centralizada do Supabase
 * Implementa o padrão Singleton para garantir uma única instância
 * Segue os princípios SOLID (Single Responsibility)
 *
 * Responsabilidades:
 * - Gerenciar configuração e instâncias do Supabase
 * - Prover interface unificada para operações de dados
 * - Centralizar lógica de erro e validação
 * - Abstrair complexidade do Supabase Client
 */
export class SupabaseService {
  private static instance: SupabaseService;
  private client: any;
  private adminClient: any;

  private constructor() {}

  /**
   * Singleton pattern - retorna a instância única
   */
  static getInstance(): SupabaseService {
    if (!SupabaseService.instance) {
      SupabaseService.instance = new SupabaseService();
    }
    return SupabaseService.instance;
  }

  /**
   * Cliente para uso no browser (client-side)
   */
  getClient() {
    if (!this.client) {
      this.client = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
    }
    return this.client;
  }

  /**
   * Cliente administrativo para server-side (API routes)
   */
  getAdminClient() {
    if (!this.adminClient) {
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      // Temporary log for debugging Vercel environment variable
      console.log(
        'DEBUG: Initializing AdminClient with key:',
        serviceRoleKey ? serviceRoleKey.substring(0, 5) + '...' : 'NOT_SET'
      );

      this.adminClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceRoleKey!, // Use the variable
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        }
      );
    }
    return this.adminClient;
  }

  static validateEnvironment(): boolean {
    const required = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
    ];

    return required.every(key => !!process.env[key]);
  }

  /**
   * Cria cliente server com cookies fornecidos
   * Para usar em middleware ou server components
   */
  static createServerClientWithCookies(cookieStore: any) {
    const { createServerClient } = require('@supabase/ssr');

    return createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet: any[]) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );
  }

  // Função para limpar todos os dados de autenticação
  static async clearAllAuth() {
    try {
      // Logout do Supabase
      await supabase.auth.signOut();

      // Limpar todos os storages
      localStorage.clear();
      sessionStorage.clear();

      // Limpar cookies relacionados ao Supabase
      document.cookie.split(';').forEach(c => {
        const eqPos = c.indexOf('=');
        const name = eqPos > -1 ? c.substr(0, eqPos) : c;
        if (name.trim().includes('sb-')) {
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
        }
      });

      console.log('Autenticação limpa com sucesso');

      // Recarregar página
      window.location.href = '/';
    } catch (error) {
      console.error('Erro ao limpar autenticação:', error);
    }
  }

  // Função de debug para ver configuração atual
  static debugAuth() {
    console.log('SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log(
      'SUPABASE_ANON_KEY:',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20) + '...'
    );
    console.log('LocalStorage keys:', Object.keys(localStorage));
    console.log('SessionStorage keys:', Object.keys(sessionStorage));
  }
}

/**
 * Instância padrão do Supabase (cliente)
 */
export const supabase = SupabaseService.getInstance().getClient();

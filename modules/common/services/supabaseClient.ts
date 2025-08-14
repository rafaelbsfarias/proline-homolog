import { SupabaseService } from './SupabaseService';

/**
 * Cliente Supabase centralizado
 * Usa o SupabaseService para gerenciar a configuração
 * Mantém compatibilidade com código existente
 */
export const supabase = SupabaseService.getInstance().getClient();

/**
 * Valida se o ambiente está configurado corretamente
 */
export const validateSupabaseEnvironment = () => {
  return SupabaseService.validateEnvironment();
};

/**
 * Cria cliente administrativo para operações server-side
 */
export const createAdminClient = () => {
  return SupabaseService.getInstance().getAdminClient();
};

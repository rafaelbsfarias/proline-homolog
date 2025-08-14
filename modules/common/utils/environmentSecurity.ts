/**
 * Utilitário para verificação segura de variáveis de ambiente
 * Garante que apenas NEXT_SUPABASE_SERVICE_ROLE_KEY seja usada
 */

export function getSupabaseServiceKey(): string {
  // Tentar NEXT_SUPABASE_SERVICE_ROLE_KEY primeiro (mais seguro)
  // Fallback para SUPABASE_SERVICE_ROLE_KEY se necessário
  const serviceKey =
    process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceKey) {
    throw new Error('NEXT_SUPABASE_SERVICE_ROLE_KEY ou SUPABASE_SERVICE_ROLE_KEY não configurada');
  }

  // Verificar se não começa com prefixo público (prevenção extra)
  if (serviceKey.startsWith('NEXT_PUBLIC_')) {
    throw new Error('Service role key não pode ter prefixo público');
  }

  return serviceKey;
}

export function getSupabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!url) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL não configurada');
  }

  return url;
}

/**
 * Verificação de segurança das variáveis de ambiente
 */
export function validateEnvironmentSecurity(): {
  isSecure: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  // Verificar se service key não está exposta publicamente
  if (process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY) {
    issues.push('Service role key exposta com prefixo NEXT_PUBLIC_');
  }

  // Verificar se service key existe sem prefixo público
  if (!process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY) {
    issues.push('NEXT_SUPABASE_SERVICE_ROLE_KEY não configurada');
  }

  // Verificar URL pública
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    issues.push('NEXT_PUBLIC_SUPABASE_URL não configurada');
  }

  return {
    isSecure: issues.length === 0,
    issues,
  };
}

// lib/security/tokenUtils.ts
import { SupabaseService } from '@/modules/common/services/SupabaseService';

export interface TokenVerificationResult {
  user: any;
  error?: string;
  banned?: boolean;
  profile?: any;
}

/**
 * Verifica o token Bearer, retorna usuário, erro e status de banimento.
 * SRP: apenas verificação de token e banimento, sem lógica de role.
 */
export async function verifyTokenAndProfile(token: string): Promise<TokenVerificationResult> {
  const supabase = SupabaseService.getInstance().getAdminClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    return { user: null, error: 'Token inválido' };
  }

  const bannedUntil = (user as any).banned_until as string | null | undefined;
  if (bannedUntil && new Date(bannedUntil) > new Date()) {
    return { user, error: 'Usuário suspenso', banned: true };
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    return { user, error: 'Perfil não encontrado' };
  }

  return { user, profile };
}

import { SupabaseService } from '@/modules/common/services/SupabaseService';

export interface UserRole {
  role: 'admin' | 'client' | 'partner' | 'specialist' | null;
  profile: any;
}

/**
 * Obtém o papel/role do usuário baseado no perfil
 * Implementa o padrão de responsabilidade única
 */
export async function getUserRole(userId: string): Promise<UserRole> {
  try {
    const supabase = SupabaseService.createAdminClient();

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role, *')
      .eq('id', userId)
      .single();

    if (error || !profile) {
      return { role: null, profile: null };
    }

    return {
      role: profile.role as UserRole['role'],
      profile,
    };
  } catch (error) {
    console.error('Erro ao obter role do usuário:', error);
    return { role: null, profile: null };
  }
}

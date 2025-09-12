import { SupabaseService } from '@/modules/common/services/SupabaseService';

export interface SpecialistLink {
  id: string;
  full_name: string | null;
}

export interface ClientSpecialistsResult {
  specialists: SpecialistLink[];
  names: string;
}

export class ClientSpecialistsRepository {
  static async getByClientId(clientId: string): Promise<ClientSpecialistsResult> {
    const supabase = SupabaseService.getInstance().getAdminClient();

    const { data: links, error: linkErr } = await supabase
      .from('client_specialists')
      .select('specialist_id')
      .eq('client_id', clientId);

    if (linkErr) {
      throw new Error('Erro ao buscar vínculos');
    }

    const ids = (links || []).map((l: any) => l.specialist_id).filter(Boolean);
    if (ids.length === 0) {
      return { specialists: [], names: '' };
    }

    const { data: profiles, error: profErr } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', ids);

    if (profErr) {
      throw new Error('Erro ao buscar perfis de especialistas');
    }

    const specialists = (profiles || []).map((p: any) => ({
      id: p.id,
      full_name: p.full_name || null,
    }));
    const names = specialists
      .map((s: { full_name: string | null }) => s.full_name || '')
      .filter(Boolean)
      .join(', ');

    return { specialists, names };
  }
}

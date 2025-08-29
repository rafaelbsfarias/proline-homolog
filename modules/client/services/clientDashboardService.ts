import { supabase } from '@/modules/common/services/supabaseClient';

export interface ClientInfo {
  parqueamento?: number;
  taxa_operacao?: number;
}

export interface ProfileInfo {
  full_name: string;
  must_change_password?: boolean;
}

export const clientDashboardService = {
  async getCurrentUser() {
    return supabase.auth.getUser();
  },

  async getProfile(userId: string): Promise<ProfileInfo | null> {
    const profileResponse = await supabase
      .from('profiles')
      .select('full_name, must_change_password')
      .eq('id', userId)
      .single();

    if (profileResponse.data) return profileResponse.data as ProfileInfo;

    const err = profileResponse.error as unknown;
    const getStringProp = (obj: unknown, prop: string): string | undefined => {
      if (typeof obj === 'object' && obj !== null && prop in obj) {
        try {
          const r = obj as Record<string, unknown>;
          return r[prop] !== undefined ? String(r[prop]) : undefined;
        } catch {
          return undefined;
        }
      }
      return undefined;
    };

    const msg = (getStringProp(err, 'message') || String(err || '')).toLowerCase();
    const code = getStringProp(err, 'code');
    if (msg.includes('must_change_password') || msg.includes('column') || code === 'PGRST100') {
      const fallback = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', userId)
        .single();
      if (fallback.data) {
        return { ...(fallback.data as any), must_change_password: false } as ProfileInfo;
      }
    }
    return null;
  },

  async getClientInfo(userId: string): Promise<ClientInfo | null> {
    const { data } = await supabase
      .from('clients')
      .select('parqueamento, taxa_operacao')
      .eq('profile_id', userId)
      .single();
    return (data as ClientInfo) ?? null;
  },

  async getContractAcceptance(userId: string): Promise<boolean> {
    const { data } = await supabase
      .from('client_contract_acceptance')
      .select('accepted_at')
      .eq('client_id', userId)
      .maybeSingle();
    return !!data;
  },

  async acceptContract(userId: string, content: string): Promise<boolean> {
    const { error } = await supabase.rpc('accept_client_contract', {
      p_client_id: userId,
      p_content: content,
    });
    if (!error) return true;

    const { error: upsertError } = await supabase.from('client_contract_acceptance').upsert(
      {
        client_id: userId,
        content: content,
        accepted_at: new Date().toISOString(),
      },
      { onConflict: 'client_id' }
    );
    return !upsertError;
  },
};

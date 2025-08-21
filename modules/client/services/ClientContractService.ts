import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { DatabaseError, NotFoundError, ValidationError } from '@/modules/common/errors';
import { sanitizeString } from '@/modules/common/utils/inputSanitization';

export interface ClientContractData {
  clientId: string;
  content: string;
}

export class ClientContractService {
  private supabaseService: SupabaseService;

  constructor() {
    this.supabaseService = SupabaseService.getInstance();
  }

  async acceptContract(data: ClientContractData): Promise<{ success: boolean; error?: string }> {
    const { clientId, content } = data;

    try {
      const supabase = this.supabaseService.getAdminClient();

      // Verificar se o cliente existe
      const { data: clientProfile, error: clientError } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('id', clientId)
        .single();

      if (clientError || !clientProfile || clientProfile.role !== 'client') {
        throw new NotFoundError('Acesso negado. Apenas clientes podem aceitar contratos.');
      }

      // Tentar usar a RPC; se indisponível, fazer upsert direto como fallback
      const { data: rpcData, error: rpcError } = await supabase.rpc('accept_client_contract', {
        p_client_id: clientId,
        p_content: content,
      });

      if (rpcError) {
        // Fallback: upsert direto, caso a função não exista no banco
        const { error: upsertError } = await supabase.from('client_contract_acceptance').upsert(
          {
            client_id: clientId,
            content: content,
            accepted_at: new Date().toISOString(),
          },
          { onConflict: 'client_id' }
        );
        if (upsertError) {
          throw new DatabaseError(`Erro ao aceitar contrato: ${upsertError.message}`);
        }
      }

      return { success: true };
    } catch (error) {
      if (error instanceof DatabaseError || error instanceof NotFoundError || error instanceof ValidationError) {
        return { success: false, error: error.message };
      }
      return { success: false, error: 'Erro interno do servidor' };
    }
  }

  async getContractAcceptance(clientId: string): Promise<{ accepted: boolean; acceptanceDate?: string }> {
    try {
      const supabase = this.supabaseService.getAdminClient();

      const { data: acceptance, error } = await supabase
        .from('client_contract_acceptance')
        .select('accepted_at')
        .eq('client_id', clientId)
        .maybeSingle();

      if (error) {
        throw new DatabaseError(`Erro ao verificar aceite do contrato: ${error.message}`);
      }

      return {
        accepted: !!acceptance,
        acceptanceDate: acceptance?.accepted_at,
      };
    } catch (error) {
      return { accepted: false };
    }
  }
}
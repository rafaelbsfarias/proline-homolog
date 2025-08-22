import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { DatabaseError, NotFoundError, ValidationError } from '@/modules/common/errors';
import { sanitizeString, validateCEP } from '@/modules/common/utils/inputSanitization';

export interface ClientAddressData {
  clientId: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  zip_code: string;
  complement?: string;
  is_collect_point?: boolean;
  is_main_address?: boolean;
}

export class ClientAddressService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = SupabaseService.getInstance().getAdminClient();
  }

  async createAddress(data: ClientAddressData) {
    const {
      clientId,
      street,
      number,
      neighborhood,
      city,
      state,
      zip_code,
      complement,
      is_collect_point = false,
      is_main_address = false,
    } = data;

    // Validate client role
    const { data: profile, error: profileError } = await this.supabase
      .from('profiles')
      .select('role')
      .eq('id', clientId)
      .single();
    if (profileError || !profile || profile.role !== 'client') {
      throw new NotFoundError('Acesso negado. Apenas clientes podem cadastrar endereços.');
    }

    // Basic validation
    if (
      !street?.trim() ||
      !number?.trim() ||
      !neighborhood?.trim() ||
      !city?.trim() ||
      !state?.trim()
    ) {
      throw new ValidationError('Campos obrigatórios não informados.');
    }
    if (!zip_code?.trim() || !validateCEP(zip_code)) {
      throw new ValidationError('CEP inválido.');
    }

    const payload = {
      profile_id: clientId,
      street: sanitizeString(street),
      number: sanitizeString(number),
      neighborhood: sanitizeString(neighborhood),
      city: sanitizeString(city),
      state: sanitizeString(state),
      zip_code: sanitizeString(zip_code),
      complement: complement ? sanitizeString(complement) : null,
      is_collect_point,
      is_main_address,
    } as const;

    // If set as main, clear existing main first to avoid unique index conflicts
    if (is_main_address) {
      const { error: clearError } = await this.supabase
        .from('addresses')
        .update({ is_main_address: false })
        .eq('profile_id', clientId)
        .eq('is_main_address', true);
      if (clearError) {
        throw new DatabaseError(`Erro ao atualizar endereço principal: ${clearError.message}`);
      }
    }

    const { data: inserted, error: insertError } = await this.supabase
      .from('addresses')
      .insert(payload)
      .select()
      .single();

    if (insertError) {
      throw new DatabaseError(`Erro ao salvar endereço: ${insertError.message}`);
    }

    return inserted;
  }
}

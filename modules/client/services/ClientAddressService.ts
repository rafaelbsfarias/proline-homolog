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

  private async ensureClientOrPartner(clientId: string, action: 'cadastrar' | 'editar') {
    const { data: profile, error: profileError } = await this.supabase
      .from('profiles')
      .select('role')
      .eq('id', clientId)
      .single();
    if (profileError || !profile || (profile.role !== 'client' && profile.role !== 'partner')) {
      const verb = action === 'cadastrar' ? 'cadastrar' : 'editar';
      throw new NotFoundError(`Acesso negado. Apenas clientes e parceiros podem ${verb} endereços.`);
    }
  }

  private validateAddressInput({ street, number, neighborhood, city, state, zip_code }: Partial<ClientAddressData>) {
    if (!street?.trim() || !number?.trim() || !neighborhood?.trim() || !city?.trim() || !state?.trim()) {
      throw new ValidationError('Campos obrigatórios não informados.');
    }
    if (!zip_code?.trim() || !validateCEP(zip_code)) {
      throw new ValidationError('CEP inválido.');
    }
  }

  private buildPayload(base: ClientAddressData) {
    const { clientId, street, number, neighborhood, city, state, zip_code, complement, is_collect_point, is_main_address } = base;
    return {
      profile_id: clientId,
      street: sanitizeString(street),
      number: sanitizeString(number),
      neighborhood: sanitizeString(neighborhood),
      city: sanitizeString(city),
      state: sanitizeString(state),
      zip_code: sanitizeString(zip_code),
      complement: complement ? sanitizeString(complement) : null,
      is_collect_point: !!is_collect_point,
      is_main_address: !!is_main_address,
    } as const;
  }

  private async clearMainAddress(clientId: string) {
    const { error } = await this.supabase
      .from('addresses')
      .update({ is_main_address: false })
      .eq('profile_id', clientId)
      .eq('is_main_address', true);
    if (error) {
      throw new DatabaseError(`Erro ao atualizar endereço principal: ${error.message}`);
    }
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

    await this.ensureClientOrPartner(clientId, 'cadastrar');
    this.validateAddressInput({ street, number, neighborhood, city, state, zip_code });
    const payload = this.buildPayload({
      clientId,
      street,
      number,
      neighborhood,
      city,
      state,
      zip_code,
      complement,
      is_collect_point,
      is_main_address,
    });

    // If set as main, clear existing main first to avoid unique index conflicts
    if (is_main_address) {
      await this.clearMainAddress(clientId);
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

  async updateAddress(data: ClientAddressData & { addressId: string }) {
    const {
      addressId,
      clientId,
      street,
      number,
      neighborhood,
      city,
      state,
      zip_code,
      complement,
      is_collect_point,
      is_main_address,
    } = data;

    await this.ensureClientOrPartner(clientId, 'editar');
    this.validateAddressInput({ street, number, neighborhood, city, state, zip_code });

    const payload = {
      street: sanitizeString(street),
      number: sanitizeString(number),
      neighborhood: sanitizeString(neighborhood),
      city: sanitizeString(city),
      state: sanitizeString(state),
      zip_code: sanitizeString(zip_code),
      complement: complement ? sanitizeString(complement) : null,
      ...(typeof is_collect_point === 'boolean' ? { is_collect_point } : {}),
      ...(typeof is_main_address === 'boolean' ? { is_main_address } : {}),
    } as const;

    if (is_main_address) {
      await this.clearMainAddress(clientId);
    }

    const { data: updated, error: updateError } = await this.supabase
      .from('addresses')
      .update(payload)
      .eq('id', addressId)
      .eq('profile_id', clientId)
      .select()
      .single();

    if (updateError) {
      throw new DatabaseError(`Erro ao atualizar endereço: ${updateError.message}`);
    }

    return updated;
  }
}

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

export interface AddressItem {
  id: string;
  profile_id: string;
  street: string | null;
  number: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  complement: string | null;
  is_collect_point: boolean;
  is_main_address: boolean;
  created_at: string;
}

export class ClientAddressService {
  private supabaseService: SupabaseService;

  constructor() {
    this.supabaseService = SupabaseService.getInstance();
  }

  private async ensureClientOrPartner(clientId: string, action: 'cadastrar' | 'editar') {
    const supabase = this.supabaseService.getAdminClient();
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', clientId)
      .single();

    if (profileError || !profile || (profile.role !== 'client' && profile.role !== 'partner')) {
      const verb = action === 'cadastrar' ? 'cadastrar' : 'editar';
      throw new NotFoundError(
        `Acesso negado. Apenas clientes e parceiros podem ${verb} endereços.`
      );
    }
  }

  private validateAddressInput({
    street,
    number,
    neighborhood,
    city,
    state,
    zip_code,
  }: Partial<ClientAddressData>) {
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
  }

  private buildPayload(base: ClientAddressData) {
    const {
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
    } = base;
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
    const supabase = this.supabaseService.getAdminClient();
    const { error } = await supabase
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

    const supabase = this.supabaseService.getAdminClient();
    const { data: inserted, error: insertError } = await supabase
      .from('addresses')
      .insert(payload)
      .select()
      .single();

    if (insertError) {
      throw new DatabaseError(`Erro ao salvar endereço: ${insertError.message}`);
    }

    return inserted;
  }

  async updateAddress(addressId: string, clientId: string, data: Partial<ClientAddressData>) {
    await this.ensureClientOrPartner(clientId, 'editar');
    this.validateAddressInput(data);

    const supabase = this.supabaseService.getAdminClient();

    const payload: Record<string, any> = {};
    if (data.street !== undefined) payload.street = sanitizeString(data.street);
    if (data.number !== undefined) payload.number = sanitizeString(data.number);
    if (data.neighborhood !== undefined) payload.neighborhood = sanitizeString(data.neighborhood);
    if (data.city !== undefined) payload.city = sanitizeString(data.city);
    if (data.state !== undefined) payload.state = sanitizeString(data.state);
    if (data.zip_code !== undefined) {
      if (!validateCEP(data.zip_code)) {
        throw new ValidationError('CEP inválido.');
      }
      payload.zip_code = sanitizeString(data.zip_code);
    }
    if (data.complement !== undefined)
      payload.complement = data.complement ? sanitizeString(data.complement) : null;
    if (data.is_collect_point !== undefined) payload.is_collect_point = !!data.is_collect_point;
    if (data.is_main_address !== undefined) {
      payload.is_main_address = !!data.is_main_address;
      // If set as main, clear existing main first
      if (data.is_main_address) {
        await this.clearMainAddress(clientId);
      }
    }

    const { data: updated, error: updateError } = await supabase
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

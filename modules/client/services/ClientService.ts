import { IClientService } from '@/modules/client/interfaces/IClientService';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { VehicleData } from 'modules/client/types/index';
import { Result, createSuccess, createError } from '@/modules/common/types/domain';
import { DatabaseError } from '@/modules/common/errors';

export class ClientService implements IClientService {
  private supabaseService: SupabaseService;

  constructor() {
    this.supabaseService = SupabaseService.getInstance();
  }

  async getVehicles(userId: string): Promise<Result<VehicleData[]>> {
    try {
      const supabase = this.supabaseService.getAdminClient();

      const { data, error } = await supabase
        .from('vehicles')
        .select('id, plate, brand, model, color, year, status, created_at')
        .eq('client_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new DatabaseError(`Erro ao buscar veículos: ${error.message}`);
      }

      return createSuccess((data as VehicleData[]) || []);
    } catch (error) {
      return createError(error instanceof Error ? error : new Error('Erro desconhecido'));
    }
  }

  async createVehicle(vehicleData: any, userId: string): Promise<Result<VehicleData>> {
    try {
      const supabase = this.supabaseService.getAdminClient();

      const { data, error } = await supabase
        .from('vehicles')
        .insert({
          ...vehicleData,
          client_id: userId,
          status: 'AGUARDANDO DEFINIÇÃO DE COLETA',
        })
        .select()
        .single();

      if (error) {
        throw new DatabaseError(`Erro ao criar veículo: ${error.message}`);
      }

      return createSuccess(data as VehicleData);
    } catch (error) {
      return createError(error instanceof Error ? error : new Error('Erro desconhecido'));
    }
  }

  async updateVehicle(
    vehicleId: string,
    vehicleData: any,
    userId: string
  ): Promise<Result<VehicleData>> {
    try {
      const supabase = this.supabaseService.getAdminClient();

      // Verificar se o veículo pertence ao usuário
      const { data: existingVehicle, error: fetchError } = await supabase
        .from('vehicles')
        .select('id')
        .eq('id', vehicleId)
        .eq('client_id', userId)
        .maybeSingle();

      if (fetchError || !existingVehicle) {
        throw new DatabaseError('Veículo não encontrado ou acesso negado');
      }

      const { data, error } = await supabase
        .from('vehicles')
        .update(vehicleData)
        .eq('id', vehicleId)
        .select()
        .single();

      if (error) {
        throw new DatabaseError(`Erro ao atualizar veículo: ${error.message}`);
      }

      return createSuccess(data as VehicleData);
    } catch (error) {
      return createError(error instanceof Error ? error : new Error('Erro desconhecido'));
    }
  }

  async deleteVehicle(vehicleId: string, userId: string): Promise<Result<void>> {
    try {
      const supabase = this.supabaseService.getAdminClient();

      // Verificar se o veículo pertence ao usuário
      const { data: existingVehicle, error: fetchError } = await supabase
        .from('vehicles')
        .select('id')
        .eq('id', vehicleId)
        .eq('client_id', userId)
        .maybeSingle();

      if (fetchError || !existingVehicle) {
        throw new DatabaseError('Veículo não encontrado ou acesso negado');
      }

      const { error } = await supabase.from('vehicles').delete().eq('id', vehicleId);

      if (error) {
        throw new DatabaseError(`Erro ao deletar veículo: ${error.message}`);
      }

      return createSuccess(undefined);
    } catch (error) {
      return createError(error instanceof Error ? error : new Error('Erro desconhecido'));
    }
  }

  async getVehicleById(vehicleId: string, userId: string): Promise<Result<VehicleData>> {
    try {
      const supabase = this.supabaseService.getAdminClient();

      const { data, error } = await supabase
        .from('vehicles')
        .select('id, plate, brand, model, color, year, status, created_at')
        .eq('id', vehicleId)
        .eq('client_id', userId)
        .maybeSingle();

      if (error) {
        throw new DatabaseError(`Erro ao buscar veículo: ${error.message}`);
      }

      if (!data) {
        throw new DatabaseError('Veículo não encontrado');
      }

      return createSuccess(data as VehicleData);
    } catch (error) {
      return createError(error instanceof Error ? error : new Error('Erro desconhecido'));
    }
  }
}

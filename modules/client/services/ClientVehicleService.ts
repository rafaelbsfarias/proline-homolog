import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { DatabaseError, NotFoundError, ValidationError } from '@/modules/common/errors';
import { sanitizeString } from '@/modules/common/utils/inputSanitization';
import {
  validatePlate,
  preparePlateForStorage,
  PLATE_ERROR_MESSAGES,
} from '@/modules/common/utils/plateValidation';

export interface ClientVehicleData {
  plate: string;
  brand: string;
  model: string;
  color: string;
  year: number;
  initialKm?: number;
  fipe_value?: number;
  observations?: string;
  clientId: string;
}

export interface VehicleInfo {
  id: string;
  plate: string;
  brand: string;
  model: string;
  color: string;
  year: number;
  status: string;
  created_at: string;
  fipe_value?: number;
  current_odometer?: number;
  fuel_level?: string;
  estimated_arrival_date?: string | null;
}

export class ClientVehicleService {
  private supabaseService: SupabaseService;

  constructor() {
    this.supabaseService = SupabaseService.getInstance();
  }

  // Helper method to get vehicle selection fields
  private getVehicleSelectionFields(): string {
    return `
      id,
      plate,
      brand,
      model,
      color,
      year,
      status,
      created_at,
      fipe_value,
      current_odometer,
      fuel_level,
      estimated_arrival_date
    `;
  }

  // Helper method to check if vehicle belongs to client
  private async checkVehicleOwnership(vehicleId: string, clientId: string): Promise<void> {
    const supabase = this.supabaseService.getAdminClient();
    const { data: existingVehicle, error: checkError } = await supabase
      .from('vehicles')
      .select('id')
      .eq('id', vehicleId)
      .eq('client_id', clientId)
      .maybeSingle();

    if (checkError || !existingVehicle) {
      throw new NotFoundError('Veículo não encontrado ou acesso negado.');
    }
  }

  async createVehicle(data: ClientVehicleData): Promise<VehicleInfo> {
    const { plate, brand, model, color, year, initialKm, fipe_value, observations, clientId } =
      data;

    // 1. Validate plate format
    if (!validatePlate(plate)) {
      throw new ValidationError(PLATE_ERROR_MESSAGES.INVALID_FORMAT);
    }
    const sanitizedPlate = preparePlateForStorage(plate);

    // 2. Validate year
    const currentYear = new Date().getFullYear();
    if (year < 1900 || year > currentYear + 1) {
      throw new ValidationError(`Ano deve estar entre 1900 e ${currentYear + 1}.`);
    }

    // 3. Validate numeric values
    if (initialKm !== undefined && (initialKm < 0 || !Number.isInteger(initialKm))) {
      throw new ValidationError('Quilometragem inicial deve ser um número inteiro positivo.');
    }
    if (fipe_value !== undefined && (fipe_value < 0 || isNaN(fipe_value))) {
      throw new ValidationError('Valor FIPE deve ser um número positivo.');
    }

    // 4. Check if the client exists and has the 'client' role
    const supabase = this.supabaseService.getAdminClient();
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', clientId)
      .single();

    if (profileError || !profile || profile.role !== 'client') {
      throw new NotFoundError('Acesso negado. Apenas clientes podem cadastrar veículos.');
    }

    // 5. Check for duplicate license plate
    const { data: existingVehicle, error: plateCheckError } = await supabase
      .from('vehicles')
      .select('id')
      .eq('plate', sanitizedPlate)
      .eq('client_id', clientId)
      .maybeSingle();

    if (plateCheckError) {
      throw new DatabaseError(`Erro ao verificar placa existente: ${plateCheckError.message}`);
    }
    if (existingVehicle) {
      throw new ValidationError(PLATE_ERROR_MESSAGES.DUPLICATE);
    }

    // 6. Insert the vehicle into the database
    const { data: vehicle, error: insertError } = await supabase
      .from('vehicles')
      .insert({
        client_id: clientId,
        plate: sanitizedPlate,
        brand: sanitizeString(brand),
        model: sanitizeString(model),
        color: sanitizeString(color),
        year,
        initial_km: initialKm,
        fipe_value: fipe_value,
        observations: observations ? sanitizeString(observations) : null,
        status: 'AGUARDANDO DEFINIÇÃO DE COLETA',
      })
      .select()
      .single();

    if (insertError) {
      throw new DatabaseError(
        `Erro interno do servidor ao cadastrar veículo: ${insertError.message}`
      );
    }

    return vehicle as VehicleInfo;
  }

  async getVehiclesByClient(clientId: string): Promise<VehicleInfo[]> {
    try {
      const supabase = this.supabaseService.getAdminClient();

      const { data: vehicles, error } = await supabase
        .from('vehicles')
        .select(this.getVehicleSelectionFields())
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new DatabaseError(`Erro ao buscar veículos: ${error.message}`);
      }

      return (vehicles || []) as VehicleInfo[];
    } catch (error) {
      throw new DatabaseError(
        `Erro interno do servidor: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      );
    }
  }

  async getVehicleById(vehicleId: string, clientId: string): Promise<VehicleInfo | null> {
    try {
      const supabase = this.supabaseService.getAdminClient();

      const { data: vehicle, error } = await supabase
        .from('vehicles')
        .select(this.getVehicleSelectionFields())
        .eq('id', vehicleId)
        .eq('client_id', clientId)
        .maybeSingle();

      if (error) {
        throw new DatabaseError(`Erro ao buscar veículo: ${error.message}`);
      }

      return vehicle as VehicleInfo | null;
    } catch (error) {
      throw new DatabaseError(
        `Erro interno do servidor: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      );
    }
  }

  async updateVehicle(
    vehicleId: string,
    clientId: string,
    data: Partial<ClientVehicleData>
  ): Promise<VehicleInfo> {
    try {
      // Check if vehicle belongs to client
      await this.checkVehicleOwnership(vehicleId, clientId);

      // Prepare update data
      const updateData: Record<string, unknown> = {};
      if (data.brand !== undefined) updateData.brand = sanitizeString(data.brand);
      if (data.model !== undefined) updateData.model = sanitizeString(data.model);
      if (data.color !== undefined) updateData.color = sanitizeString(data.color);
      if (data.year !== undefined) updateData.year = data.year;
      if (data.initialKm !== undefined) updateData.initial_km = data.initialKm;
      if (data.fipe_value !== undefined) updateData.fipe_value = data.fipe_value;
      if (data.observations !== undefined)
        updateData.observations = data.observations ? sanitizeString(data.observations) : null;

      const supabase = this.supabaseService.getAdminClient();

      // Update the vehicle
      const { data: vehicle, error: updateError } = await supabase
        .from('vehicles')
        .update(updateData)
        .eq('id', vehicleId)
        .eq('client_id', clientId)
        .select()
        .single();

      if (updateError) {
        throw new DatabaseError(`Erro ao atualizar veículo: ${updateError.message}`);
      }

      return vehicle as VehicleInfo;
    } catch (error) {
      if (error instanceof DatabaseError || error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError(
        `Erro interno do servidor: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      );
    }
  }

  async deleteVehicle(vehicleId: string, clientId: string): Promise<void> {
    try {
      // Check if vehicle belongs to client
      await this.checkVehicleOwnership(vehicleId, clientId);

      const supabase = this.supabaseService.getAdminClient();

      // Delete the vehicle
      const { error: deleteError } = await supabase.from('vehicles').delete().eq('id', vehicleId);

      if (deleteError) {
        throw new DatabaseError(`Erro ao deletar veículo: ${deleteError.message}`);
      }
    } catch (error) {
      if (error instanceof DatabaseError || error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError(
        `Erro interno do servidor: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      );
    }
  }
}

import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import {
  ConflictError,
  DatabaseError,
  NotFoundError,
  ValidationError,
  AppError,
} from '@/modules/common/errors';
import {
  validatePlate,
  preparePlateForStorage,
  PLATE_ERROR_MESSAGES,
} from '@/modules/common/utils/plateValidation';
import { sanitizeNumber } from '@/modules/common/utils/inputSanitization';

interface ClientVehicleData {
  plate: string;
  brand: string;
  model: string;
  color: string;
  year: number;
  initialKm?: number;
  fipe_value?: number;
  observations?: string;
  clientId: string; // The ID of the client creating the vehicle
}

export class ClientVehicleService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = SupabaseService.getInstance().getAdminClient(); // Using admin client for server-side operations
  }

  async createVehicle(data: ClientVehicleData): Promise<any> {
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
    const { data: profile, error: profileError } = await this.supabase
      .from('profiles')
      .select('role')
      .eq('id', clientId)
      .single();

    if (profileError || !profile || profile.role !== 'client') {
      throw new NotFoundError('Acesso negado. Apenas clientes podem cadastrar veículos.');
    }

    // 5. Check for duplicate license plate
    const { data: existingVehicle, error: plateCheckError } = await this.supabase
      .from('vehicles')
      .select('id')
      .eq('plate', sanitizedPlate)
      .maybeSingle();

    if (plateCheckError) {
      throw new DatabaseError(`Erro ao verificar placa existente: ${plateCheckError.message}`);
    }
    if (existingVehicle) {
      throw new ConflictError(PLATE_ERROR_MESSAGES.DUPLICATE);
    }

    // 6. Insert the vehicle into the database
    const { data: vehicle, error: insertError } = await this.supabase
      .from('vehicles')
      .insert({
        client_id: clientId,
        plate: sanitizedPlate,
        brand: brand.trim(),
        model: model.trim(),
        color: color.trim(),
        year,
        fipe_value: fipe_value || null,
        status: 'definir opção de coleta',
      })
      .select()
      .single();

    if (insertError) {
      throw new DatabaseError(
        `Erro interno do servidor ao cadastrar veículo: ${insertError.message}`
      );
    }

    return vehicle;
  }
}

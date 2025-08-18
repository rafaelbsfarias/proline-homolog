import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import {
  ConflictError,
  DatabaseError,
  NotFoundError,
  ValidationError,
  AppError,
} from '@/lib/utils/errors';
import {
  validatePlate,
  preparePlateForStorage,
  PLATE_ERROR_MESSAGES,
} from '@/modules/common/utils/plateValidation';
import { sanitizeNumber } from '@/modules/common/utils/inputSanitization';
import { getLogger, ILogger } from '@/modules/logger';

const logger: ILogger = getLogger('VehicleCreationService');

interface VehicleCreationData {
  clientId: string;
  plate: string;
  brand: string;
  model: string;
  color: string;
  year: number;
  fipe_value?: number;
  estimated_arrival_date?: string;
  createdBy?: string; // User ID of the admin creating the vehicle
}

export class VehicleCreationService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = SupabaseService.getInstance().getAdminClient();
    logger.info('VehicleCreationService initialized.');
  }

  async createVehicle(data: VehicleCreationData): Promise<any> {
    const {
      clientId,
      plate,
      brand,
      model,
      color,
      year,
      fipe_value,
      estimated_arrival_date,
      createdBy,
    } = data;

    logger.info(`Attempting to create vehicle for client ${clientId} with plate ${plate}.`);
    logger.debug('Vehicle creation data:', data);

    // 1. Validate plate format
    if (!validatePlate(plate)) {
      logger.warn(`Invalid plate format for ${plate}.`);
      throw new ValidationError(PLATE_ERROR_MESSAGES.INVALID_FORMAT);
    }
    const sanitizedplate = preparePlateForStorage(plate);
    logger.debug(`Plate ${plate} sanitized to ${sanitizedplate}.`);

    // 2. Validate year
    const currentYear = new Date().getFullYear();
    if (year < 1900 || year > currentYear + 1) {
      logger.warn(`Invalid year ${year} for vehicle creation.`);
      throw new ValidationError(`Ano deve estar entre 1900 e ${currentYear + 1}.`);
    }

    // 3. Validate optional numeric values
    const sanitizedfipe_value = fipe_value ? sanitizeNumber(fipe_value) : null;
    if (
      fipe_value &&
      (sanitizedfipe_value === null || isNaN(sanitizedfipe_value) || sanitizedfipe_value <= 0)
    ) {
      logger.warn(`Invalid FIPE value ${fipe_value} for vehicle creation.`);
      throw new ValidationError('Valor FIPE deve ser um número positivo válido.');
    }

    // 4. Validate estimated arrival date if provided
    if (estimated_arrival_date) {
      const date = new Date(estimated_arrival_date);
      if (isNaN(date.getTime())) {
        logger.warn(`Invalid estimated arrival date: ${estimated_arrival_date}.`);
        throw new ValidationError('Data de previsão de chegada inválida.');
      }
    }

    // 5. Check if client exists and is a valid client
    logger.info(`Checking client ${clientId} existence and role.`);
    const { data: clientProfile, error: clientProfileError } = await this.supabase
      .from('profiles')
      .select('id, role')
      .eq('id', clientId)
      .eq('role', 'client')
      .single();

    if (clientProfileError || !clientProfile) {
      logger.error(`Client ${clientId} not found or not a valid client:`, clientProfileError);
      throw new NotFoundError('Cliente não encontrado ou não é um cliente válido.');
    }
    logger.info(`Client ${clientId} found and is a valid client.`);

    // 6. Check for duplicate license plate
    logger.info(`Checking for duplicate license plate ${sanitizedplate}.`);
    const { data: existingVehicle, error: plateCheckError } = await this.supabase
      .from('vehicles')
      .select('id, plate')
      .eq('plate', sanitizedplate)
      .maybeSingle();

    if (plateCheckError) {
      logger.error(`Error checking for existing plate ${sanitizedplate}:`, plateCheckError);
      throw new DatabaseError(`Erro ao verificar placa existente: ${plateCheckError.message}`);
    }
    if (existingVehicle) {
      logger.warn(`Duplicate plate ${sanitizedplate} found.`);
      throw new ConflictError(PLATE_ERROR_MESSAGES.DUPLICATE);
    }
    logger.info(`Plate ${sanitizedplate} is unique.`);

    // 7. Insert vehicle into database
    logger.info(`Inserting vehicle ${sanitizedplate} into database.`);
    const { data: vehicleData, error: insertError } = await this.supabase
      .from('vehicles')
      .insert({
        client_id: clientId,
        plate: sanitizedplate,
        brand: brand,
        model: model,
        color: color,
        year: year,
        fipe_value: sanitizedfipe_value,
        estimated_arrival_date: estimated_arrival_date,
        created_by: createdBy,
        status: 'definir opção de coleta',
      })
      .select(
        `
        id,
        plate,
        brand,
        model,
        color,
        year,
        fipe_value,
        estimated_arrival_date,
        status,
        created_at
      `
      )
      .single();

    if (insertError) {
      logger.error(`Error inserting vehicle ${sanitizedplate}:`, insertError);
      throw new DatabaseError(`Erro ao cadastrar veículo: ${insertError.message}`);
    }

    logger.info(`Vehicle ${sanitizedplate} created successfully. Vehicle ID: ${vehicleData.id}`);
    return vehicleData;
  }
}

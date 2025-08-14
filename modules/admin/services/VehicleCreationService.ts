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
import { getLogger, ILogger } from '@/modules/logger';

const logger: ILogger = getLogger('VehicleCreationService');

interface VehicleCreationData {
  clientId: string;
  licensePlate: string;
  brand: string;
  model: string;
  color: string;
  year: number;
  fipeValue?: number;
  estimatedArrivalDate?: string;
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
      licensePlate,
      brand,
      model,
      color,
      year,
      fipeValue,
      estimatedArrivalDate,
      createdBy,
    } = data;

    logger.info(`Attempting to create vehicle for client ${clientId} with plate ${licensePlate}.`);
    logger.debug('Vehicle creation data:', data);

    // 1. Validate plate format
    if (!validatePlate(licensePlate)) {
      logger.warn(`Invalid plate format for ${licensePlate}.`);
      throw new ValidationError(PLATE_ERROR_MESSAGES.INVALID_FORMAT);
    }
    const sanitizedLicensePlate = preparePlateForStorage(licensePlate);
    logger.debug(`Plate ${licensePlate} sanitized to ${sanitizedLicensePlate}.`);

    // 2. Validate year
    const currentYear = new Date().getFullYear();
    if (year < 1900 || year > currentYear + 1) {
      logger.warn(`Invalid year ${year} for vehicle creation.`);
      throw new ValidationError(`Ano deve estar entre 1900 e ${currentYear + 1}.`);
    }

    // 3. Validate optional numeric values
    const sanitizedFipeValue = fipeValue ? sanitizeNumber(fipeValue) : null;
    if (fipeValue && (sanitizedFipeValue === null || isNaN(sanitizedFipeValue) || sanitizedFipeValue <= 0)) {
      logger.warn(`Invalid FIPE value ${fipeValue} for vehicle creation.`);
      throw new ValidationError('Valor FIPE deve ser um número positivo válido.');
    }

    // 4. Validate estimated arrival date if provided
    if (estimatedArrivalDate) {
      const date = new Date(estimatedArrivalDate);
      if (isNaN(date.getTime())) {
        logger.warn(`Invalid estimated arrival date: ${estimatedArrivalDate}.`);
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
    logger.info(`Checking for duplicate license plate ${sanitizedLicensePlate}.`);
    const { data: existingVehicle, error: plateCheckError } = await this.supabase
      .from('vehicles')
      .select('id, plate')
      .eq('plate', sanitizedLicensePlate)
      .maybeSingle();

    if (plateCheckError) {
      logger.error(`Error checking for existing plate ${sanitizedLicensePlate}:`, plateCheckError);
      throw new DatabaseError(`Erro ao verificar placa existente: ${plateCheckError.message}`);
    }
    if (existingVehicle) {
      logger.warn(`Duplicate plate ${sanitizedLicensePlate} found.`);
      throw new ConflictError(PLATE_ERROR_MESSAGES.DUPLICATE);
    }
    logger.info(`Plate ${sanitizedLicensePlate} is unique.`);

    // 7. Insert vehicle into database
    logger.info(`Inserting vehicle ${sanitizedLicensePlate} into database.`);
    const { data: vehicleData, error: insertError } = await this.supabase
      .from('vehicles')
      .insert({
        client_id: clientId,
        plate: sanitizedLicensePlate,
        brand: brand,
        model: model,
        color: color,
        year: year,
        fipe_value: sanitizedFipeValue,
        estimated_arrival_date: estimatedArrivalDate,
        created_by: createdBy,
        status: 'active',
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
      logger.error(`Error inserting vehicle ${sanitizedLicensePlate}:`, insertError);
      throw new DatabaseError(`Erro ao cadastrar veículo: ${insertError.message}`);
    }

    logger.info(`Vehicle ${sanitizedLicensePlate} created successfully. Vehicle ID: ${vehicleData.id}`);
    return vehicleData;
  }
}
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

const logger: ILogger = getLogger('AdminVehicleRegistrationService');

interface AdminVehicleRegistrationData {
  clientId: string;
  plate: string;
  model: string;
  color: string;
  year: number;
  fipeValue: number;
  brand?: string; // Added brand as it's required in the DB schema
}

export class AdminVehicleRegistrationService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = SupabaseService.getInstance().getAdminClient();
    logger.info('AdminVehicleRegistrationService initialized.');
  }

  async registerVehicle(data: AdminVehicleRegistrationData): Promise<any> {
    logger.info(
      `Attempting to register vehicle for client ${data.clientId} with plate ${data.plate}.`
    );
    logger.debug('Registration data:', data);

    const { clientId, plate, model, color, year, fipeValue, brand } = data;

    // 1. Validate plate format
    if (!validatePlate(plate)) {
      logger.warn(`Invalid plate format for ${plate}.`);
      throw new ValidationError(PLATE_ERROR_MESSAGES.INVALID_FORMAT);
    }
    const sanitizedPlate = preparePlateForStorage(plate);
    logger.debug(`Plate ${plate} sanitized to ${sanitizedPlate}.`);

    // 2. Validate year
    const currentYear = new Date().getFullYear();
    if (year < 1900 || year > currentYear + 1) {
      logger.warn(`Invalid year ${year} for vehicle registration.`);
      throw new ValidationError(`Ano deve estar entre 1900 e ${currentYear + 1}.`);
    }

    // 3. Validate FIPE value
    if (fipeValue <= 0 || isNaN(fipeValue)) {
      logger.warn(`Invalid FIPE value ${fipeValue} for vehicle registration.`);
      throw new ValidationError('Valor FIPE deve ser um número positivo.');
    }

    // 4. Check if client exists and has the 'client' role
    logger.info(`Checking client ${clientId} existence and role.`);
    const { data: clientProfile, error: clientError } = await this.supabase
      .from('profiles')
      .select('id, role')
      .eq('id', clientId)
      .eq('role', 'client')
      .single();

    if (clientError || !clientProfile || clientProfile.role !== 'client') {
      logger.error(`Client ${clientId} invalid or not found:`, clientError);
      throw new NotFoundError('Cliente inválido ou inexistente.');
    }
    logger.info(`Client ${clientId} found and has 'client' role.`);

    // 5. Check for duplicate license plate
    logger.info(`Checking for duplicate plate ${sanitizedPlate}.`);
    const { data: existingVehicle, error: plateCheckError } = await this.supabase
      .from('vehicles')
      .select('id, plate')
      .eq('plate', sanitizedPlate)
      .maybeSingle();

    if (plateCheckError) {
      logger.error(`Error checking for existing plate ${sanitizedPlate}:`, plateCheckError);
      throw new DatabaseError(`Erro ao verificar placa existente: ${plateCheckError.message}`);
    }
    if (existingVehicle) {
      logger.warn(`Duplicate plate ${sanitizedPlate} found.`);
      throw new ConflictError(PLATE_ERROR_MESSAGES.DUPLICATE);
    }
    logger.info(`Plate ${sanitizedPlate} is unique.`);

    // 6. Insert vehicle into database
    logger.info(`Inserting vehicle ${sanitizedPlate} into database.`);
    const { data: vehicleData, error: insertError } = await this.supabase
      .from('vehicles')
      .insert({
        client_id: clientId,
        plate: sanitizedPlate,
        brand: brand || 'N/A', // Use provided brand or default to 'N/A'
        model: model,
        color: color,
        year: year,
        fipe_value: fipeValue,
        status: 'active',
      })
      .select()
      .single();

    if (insertError) {
      logger.error(`Error inserting vehicle ${sanitizedPlate}:`, insertError);
      throw new DatabaseError(`Erro ao cadastrar veículo: ${insertError.message}`);
    }

    logger.info(`Vehicle ${sanitizedPlate} registered successfully. Vehicle ID: ${vehicleData.id}`);
    return vehicleData;
  }
}

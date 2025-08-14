import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import {
  sanitizeString,
  sanitizeObject,
  sanitizeNumber,
} from '@/modules/common/utils/inputSanitization';
import { VehicleCreationService } from '@/modules/admin/services/VehicleCreationService';
import {
  ConflictError,
  DatabaseError,
  NotFoundError,
  ValidationError,
  AppError,
} from '@/modules/common/errors';
import { PLATE_ERROR_MESSAGES } from '@/modules/common/utils/plateValidation';
import { getLogger, ILogger } from '@/modules/logger';

const logger: ILogger = getLogger('AdminCreateVehicleAPI');

async function createVehicleHandler(req: AuthenticatedRequest) {
  const adminUser = req.user;
  logger.info(`Handler started by admin: ${adminUser?.email} (${adminUser?.id})`);

  try {
    const rawData = await req.json();
    const sanitizedData = sanitizeObject(rawData);
    const { clientId, licensePlate, brand, model, color, year, fipeValue, estimatedArrivalDate } =
      sanitizedData;
    logger.debug('Received raw data for new vehicle:', rawData);
    logger.info(`Attempting to create vehicle with plate: ${licensePlate} for client: ${clientId}`);

    // Validação de campos obrigatórios
    if (!clientId || !licensePlate || !brand || !model || !color || !year) {
      logger.warn('Missing required fields for vehicle creation.');
      throw new ValidationError('Campos obrigatórios não informados.');
    }

    // Sanitize and validate types
    const sanitizedClientId = sanitizeString(clientId as string);
    const sanitizedBrand = sanitizeString(brand as string);
    const sanitizedModel = sanitizeString(model as string);
    const sanitizedColor = sanitizeString(color as string);
    const sanitizedYear = sanitizeNumber(year as number);
    const sanitizedFipeValue = fipeValue ? sanitizeNumber(fipeValue) : undefined;
    const sanitizedEstimatedArrivalDate = estimatedArrivalDate
      ? sanitizeString(estimatedArrivalDate as string)
      : undefined;

    // Obtain createdBy user ID from auth header
    let createdBy: string | undefined = undefined;
    const authHeader = req.headers.get('authorization');
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const {
        data: { user },
      } = await SupabaseService.getInstance().getAdminClient().auth.getUser(token);
      createdBy = user?.id || undefined;
      logger.debug(`Vehicle created by user ID: ${createdBy}`);
    }

    const vehicleCreationService = new VehicleCreationService();
    const vehicle = await vehicleCreationService.createVehicle({
      clientId: sanitizedClientId,
      licensePlate: licensePlate as string, // Service will handle plate sanitization/validation
      brand: sanitizedBrand,
      model: sanitizedModel,
      color: sanitizedColor,
      year: sanitizedYear,
      fipeValue: sanitizedFipeValue,
      estimatedArrivalDate: sanitizedEstimatedArrivalDate,
      createdBy: createdBy,
    });

    logger.info(`Vehicle ${vehicle.plate} created successfully for client ${clientId}.`);
    return NextResponse.json({
      success: true,
      message: 'Veículo cadastrado com sucesso!',
      vehicle: vehicle,
    });
  } catch (error: unknown) {
    logger.error('Error in createVehicleHandler:', error);

    if (error instanceof ConflictError) {
      logger.warn(`Conflict error during vehicle creation: ${error.message}`);
      return NextResponse.json(
        { error: error.message, code: 'DUPLICATE_PLATE' },
        { status: error.statusCode }
      );
    }
    if (error instanceof NotFoundError) {
      logger.warn(`Not found error during vehicle creation: ${error.message}`);
      return NextResponse.json(
        { error: error.message, code: 'CLIENT_NOT_FOUND' },
        { status: error.statusCode }
      );
    }
    if (error instanceof ValidationError) {
      logger.warn(`Validation error during vehicle creation: ${error.message}`);
      const errorCode = error.message.includes('placa') ? 'INVALID_PLATE' : 'INVALID_INPUT';
      return NextResponse.json(
        { error: error.message, code: errorCode },
        { status: error.statusCode }
      );
    }
    if (error instanceof DatabaseError) {
      logger.error(`Database error during vehicle creation: ${error.message}`);
      return NextResponse.json(
        { error: error.message, code: 'DATABASE_ERROR' },
        { status: error.statusCode }
      );
    }
    if (error instanceof AppError) {
      logger.error(`Application error during vehicle creation: ${error.message}`);
      return NextResponse.json(
        { error: error.message, code: 'APP_ERROR' },
        { status: error.statusCode }
      );
    }

    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Internal server error in createVehicleHandler:', errorMessage, error);
    return NextResponse.json(
      {
        error: 'Erro interno do servidor.',
        code: 'INTERNAL_ERROR',
        details: errorMessage,
        stack: error instanceof Error && error.stack ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

// Exportar handler protegido com autenticação admin
export const POST = withAdminAuth(createVehicleHandler);

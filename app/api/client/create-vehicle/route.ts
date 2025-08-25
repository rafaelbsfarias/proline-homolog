import { NextResponse } from 'next/server';
import { withClientAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { ClientVehicleService } from '@/modules/client/services/ClientVehicleService';
import { getLogger } from '@/modules/logger';
import { ValidationError, NotFoundError, DatabaseError, AppError } from '@/modules/common/errors';

const logger = getLogger('api:client:create-vehicle');
const vehicleService = new ClientVehicleService();

export const POST = withClientAuth(async (req: AuthenticatedRequest) => {
  try {
    const body = await req.json();
    logger.info('request_received', {
      userId: req.user?.id?.slice(0, 8),
      hasBody: !!body,
    });

    const { plate, brand, model, color, year, initialKm, fipe_value, observations } = body ?? {};

    // Validação de campos obrigatórios
    if (!plate || !brand || !model || !color || !year) {
      logger.warn('missing_required_fields', {
        userId: req.user?.id?.slice(0, 8),
        missing: [
          !plate && 'plate',
          !brand && 'brand',
          !model && 'model',
          !color && 'color',
          !year && 'year',
        ]
          .filter(Boolean)
          .join(', '),
      });
      return NextResponse.json(
        { error: 'Preencha todos os campos obrigatórios.', code: 'INVALID_INPUT' },
        { status: 400 }
      );
    }

    const clientId = req.user.id;
    logger.info('creating_vehicle', {
      userId: clientId.slice(0, 8),
      plate,
      brand,
      model,
    });

    const vehicle = await vehicleService.createVehicle({
      plate: plate as string,
      brand: brand as string,
      model: model as string,
      color: color as string,
      year: year as number,
      initialKm: initialKm ? Number(initialKm) : undefined,
      fipe_value: fipe_value ? Number(fipe_value) : undefined,
      observations: observations as string,
      clientId: clientId,
    });

    logger.info('success', {
      userId: clientId.slice(0, 8),
      vehicleId: vehicle.id.slice(0, 8),
      plate,
    });

    return NextResponse.json({
      success: true,
      vehicle: {
        id: vehicle.id,
        plate: vehicle.plate,
        brand: vehicle.brand,
        model: vehicle.model,
        color: vehicle.color,
        year: vehicle.year,
        status: vehicle.status,
      },
      message: 'Veículo cadastrado com sucesso!',
    });
  } catch (error: unknown) {
    if (error instanceof ValidationError) {
      logger.warn('validation_error', {
        userId: req.user?.id?.slice(0, 8),
        error: error.message,
      });
      return NextResponse.json(
        { error: error.message, code: 'INVALID_INPUT' },
        { status: error.statusCode }
      );
    }
    if (error instanceof NotFoundError) {
      logger.warn('access_denied', {
        userId: req.user?.id?.slice(0, 8),
        error: error.message,
      });
      return NextResponse.json(
        { error: error.message, code: 'ACCESS_DENIED' },
        { status: error.statusCode }
      );
    }
    if (error instanceof DatabaseError) {
      logger.error('db_error', {
        userId: req.user?.id?.slice(0, 8),
        error: error.message,
      });
      return NextResponse.json(
        { error: error.message, code: 'DATABASE_ERROR' },
        { status: error.statusCode }
      );
    }
    if (error instanceof AppError) {
      // Catch any other custom AppError
      logger.error('app_error', {
        userId: req.user?.id?.slice(0, 8),
        error: error.message,
      });
      return NextResponse.json(
        { error: error.message, code: 'APP_ERROR' },
        { status: error.statusCode }
      );
    }

    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('unhandled_error', {
      userId: req.user?.id?.slice(0, 8),
      error: errorMessage,
    });
    return NextResponse.json(
      {
        error: 'Erro interno do servidor.',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
});

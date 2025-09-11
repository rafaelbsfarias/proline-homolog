import { NextResponse } from 'next/server';
import { withClientAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { ClientVehicleService } from '@/modules/client/services/ClientVehicleService';
import { getLogger } from '@/modules/logger';
import { ValidationError, NotFoundError, DatabaseError, AppError } from '@/modules/common/errors';

const logger = getLogger('api:client:update-vehicle');
const vehicleService = new ClientVehicleService();

export const PUT = withClientAuth(async (req: AuthenticatedRequest, { params }) => {
  try {
    const { vehicleId } = params;
    const body = await req.json();

    logger.info('request_received', {
      userId: req.user?.id?.slice(0, 8),
      vehicleId: vehicleId?.slice(0, 8),
      hasBody: !!body,
    });

    if (!vehicleId) {
      return NextResponse.json(
        { error: 'ID do veículo é obrigatório.', code: 'INVALID_INPUT' },
        { status: 400 }
      );
    }

    const clientId = req.user.id;
    logger.info('updating_vehicle', {
      userId: clientId.slice(0, 8),
      vehicleId: vehicleId.slice(0, 8),
    });

    const vehicle = await vehicleService.updateVehicle(vehicleId, clientId, body);

    logger.info('success', {
      userId: clientId.slice(0, 8),
      vehicleId: vehicle.id.slice(0, 8),
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
      message: 'Veículo atualizado com sucesso!',
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

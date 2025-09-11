import { NextResponse } from 'next/server';
import { withClientAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { ClientVehicleService } from '@/modules/client/services/ClientVehicleService';
import { getLogger } from '@/modules/logger';
import { NotFoundError, DatabaseError, AppError } from '@/modules/common/errors';

const logger = getLogger('api:client:delete-vehicle');
const vehicleService = new ClientVehicleService();

export const DELETE = withClientAuth(async (req: AuthenticatedRequest, { params }) => {
  try {
    const { vehicleId } = params;

    logger.info('request_received', {
      userId: req.user?.id?.slice(0, 8),
      vehicleId: vehicleId?.slice(0, 8),
    });

    if (!vehicleId) {
      return NextResponse.json(
        { error: 'ID do veículo é obrigatório.', code: 'INVALID_INPUT' },
        { status: 400 }
      );
    }

    const clientId = req.user.id;
    logger.info('deleting_vehicle', {
      userId: clientId.slice(0, 8),
      vehicleId: vehicleId.slice(0, 8),
    });

    await vehicleService.deleteVehicle(vehicleId, clientId);

    logger.info('success', {
      userId: clientId.slice(0, 8),
      vehicleId: vehicleId.slice(0, 8),
    });

    return NextResponse.json({
      success: true,
      message: 'Veículo excluído com sucesso!',
    });
  } catch (error: unknown) {
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

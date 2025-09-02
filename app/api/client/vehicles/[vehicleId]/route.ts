import { NextResponse } from 'next/server';
import { withClientAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { ClientVehicleService } from '@/modules/client/services/ClientVehicleService';
import { getLogger } from '@/modules/logger';
import { ValidationError, NotFoundError, DatabaseError, AppError } from '@/modules/common/errors';

const logger = getLogger('api:client:vehicle-details');
const vehicleService = new ClientVehicleService();

export const GET = withClientAuth(async (req: AuthenticatedRequest, { params }) => {
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
    logger.info('fetching_vehicle_details', {
      userId: clientId.slice(0, 8),
      vehicleId: vehicleId.slice(0, 8),
    });

    const vehicle = await vehicleService.getVehicleById(vehicleId, clientId);

    if (!vehicle) {
      throw new NotFoundError('Veículo não encontrado ou acesso negado.');
    }

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
        year: vehicle.year,
        color: vehicle.color,
        status: vehicle.status,
        created_at: vehicle.created_at,
        fipe_value: vehicle.fipe_value,
        current_odometer: vehicle.current_odometer,
        fuel_level: vehicle.fuel_level,
        estimated_arrival_date: vehicle.estimated_arrival_date,
        preparacao: vehicle.preparacao,
        comercializacao: vehicle.comercializacao,
      },
      message: 'Detalhes do veículo carregados com sucesso!',
    });
  } catch (error: unknown) {
    if (error instanceof ValidationError) {
      logger.warn('validation_error', {
        userId: req.user?.id?.slice(0, 8),
        error: (error as ValidationError).message,
      });
      return NextResponse.json(
        { error: (error as ValidationError).message, code: 'INVALID_INPUT' },
        { status: (error as ValidationError).statusCode }
      );
    }
    if (error instanceof NotFoundError) {
      logger.warn('vehicle_not_found', {
        userId: req.user?.id?.slice(0, 8),
        error: (error as NotFoundError).message,
      });
      return NextResponse.json(
        { error: (error as NotFoundError).message, code: 'NOT_FOUND' },
        { status: (error as NotFoundError).statusCode }
      );
    }
    if (error instanceof DatabaseError) {
      logger.error('db_error', {
        userId: req.user?.id?.slice(0, 8),
        error: (error as DatabaseError).message,
      });
      return NextResponse.json(
        { error: (error as DatabaseError).message, code: 'DATABASE_ERROR' },
        { status: (error as DatabaseError).statusCode }
      );
    }
    if (error instanceof AppError) {
      logger.error('app_error', {
        userId: req.user?.id?.slice(0, 8),
        error: (error as AppError).message,
      });
      return NextResponse.json(
        { error: (error as AppError).message, code: 'APP_ERROR' },
        { status: (error as AppError).statusCode }
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

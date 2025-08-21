import { NextResponse } from 'next/server';
import { withClientAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { ClientAddressService } from '@/modules/client/services/ClientAddressService';
import { AppError, DatabaseError, NotFoundError, ValidationError } from '@/modules/common/errors';
import { getLogger } from '@/modules/logger';

const logger = getLogger('api:client:update-address');

export const PUT = withClientAuth(async (req: AuthenticatedRequest) => {
  try {
    const body = await req.json();
    logger.info('request_received', { userId: req.user?.id?.slice(0, 8) });

    const { id, street, number, neighborhood, city, state, zip_code, complement, is_collect_point, is_main_address } = body ?? {};

    if (!id) {
      return NextResponse.json({ error: 'ID do endereço é obrigatório', code: 'INVALID_INPUT' }, { status: 400 });
    }

    const service = new ClientAddressService();
    const updated = await service.updateAddress(id, req.user.id, {
      clientId: req.user.id,
      street,
      number,
      neighborhood,
      city,
      state,
      zip_code,
      complement,
      is_collect_point,
      is_main_address,
    });

    logger.info('success', { userId: req.user.id.slice(0, 8), addressId: updated?.id });
    return NextResponse.json({ success: true, message: 'Endereço atualizado com sucesso!', address: updated });
  } catch (error) {
    if (error instanceof ValidationError) {
      logger.warn('validation_error', { userId: req.user.id.slice(0, 8), error: error.message });
      return NextResponse.json({ error: error.message, code: 'INVALID_INPUT' }, { status: 400 });
    }
    if (error instanceof NotFoundError) {
      logger.warn('access_denied', { userId: req.user.id.slice(0, 8), error: error.message });
      return NextResponse.json({ error: error.message, code: 'ACCESS_DENIED' }, { status: 403 });
    }
    if (error instanceof DatabaseError) {
      logger.error('db_error', { userId: req.user.id.slice(0, 8), error: error.message });
      return NextResponse.json({ error: error.message, code: 'DATABASE_ERROR' }, { status: 500 });
    }
    if (error instanceof AppError) {
      // Catch any other custom AppError
      logger.error('app_error', { userId: req.user.id.slice(0, 8), error: error.message });
      return NextResponse.json({ error: error.message, code: 'APP_ERROR' }, { status: error.statusCode });
    }

    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('unhandled_error', { userId: req.user.id.slice(0, 8), error: errorMessage });
    return NextResponse.json({ error: 'Erro interno do servidor.', details: errorMessage }, { status: 500 });
  }
});
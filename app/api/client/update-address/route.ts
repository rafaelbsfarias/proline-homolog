import { NextRequest, NextResponse } from 'next/server';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { ClientAddressService } from '@/modules/client/services/ClientAddressService';
import { AppError, DatabaseError, NotFoundError, ValidationError } from '@/modules/common/errors';
import { getLogger } from '@/modules/logger';

const logger = getLogger('api.client.update-address');

export async function PUT(req: NextRequest) {
  const requestId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const path = '/api/client/update-address';
  const method = 'PUT';
  try {
    const body = await req.json();
    logger.info('request_received', { requestId, path, method, hasBody: !!body });

    const { id, street, number, neighborhood, city, state, zip_code, complement, is_collect_point, is_main_address } = body ?? {};

    if (!id) {
      return NextResponse.json({ error: 'ID do endereço é obrigatório', code: 'INVALID_INPUT' }, { status: 400 });
    }

    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      logger.warn('missing_auth', { requestId, path, method });
      return NextResponse.json({ error: 'Token de autorização não fornecido.' }, { status: 401 });
    }
    const token = authHeader.substring(7);

    const {
      data: { user },
      error: userError,
    } = await SupabaseService.getInstance().getClient().auth.getUser(token);

    if (userError || !user) {
      logger.warn('unauthenticated', { requestId, path, method, userError: userError?.message });
      return NextResponse.json({ error: 'Usuário não autenticado ou inválido.' }, { status: 401 });
    }

    const service = new ClientAddressService();
    const updated = await service.updateAddress({
      addressId: id,
      clientId: user.id,
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

    logger.info('success', { requestId, path, method, userId: user.id, addressId: updated?.id });
    return NextResponse.json({ success: true, message: 'Endereço atualizado com sucesso!', address: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const schemaOutOfSync = /schema cache|is_collect_point|is_main_address/i.test(message);
    if (schemaOutOfSync) {
      logger.error('schema_out_of_sync', { requestId, path, method, code: 'SCHEMA_OUT_OF_SYNC', error: message });
      return NextResponse.json(
        {
          error: 'Estrutura do banco desatualizada. Aplique as migrations e atualize o cache do schema.',
          code: 'SCHEMA_OUT_OF_SYNC',
        },
        { status: 500 }
      );
    }

    if (error instanceof ValidationError) {
      logger.warn('validation_error', { requestId, path, method, code: 'INVALID_INPUT', error: error.message });
      return NextResponse.json({ error: error.message, code: 'INVALID_INPUT' }, { status: 400 });
    }
    if (error instanceof NotFoundError) {
      logger.warn('access_denied', { requestId, path, method, code: 'ACCESS_DENIED', error: error.message });
      return NextResponse.json({ error: error.message, code: 'ACCESS_DENIED' }, { status: 403 });
    }
    if (error instanceof DatabaseError) {
      logger.error('db_error', { requestId, path, method, code: 'DATABASE_ERROR', error: error.message });
      return NextResponse.json({ error: error.message, code: 'DATABASE_ERROR' }, { status: 500 });
    }
    if (error instanceof AppError) {
      logger.error('app_error', { requestId, path, method, code: 'APP_ERROR', error: error.message });
      return NextResponse.json({ error: error.message, code: 'APP_ERROR' }, { status: error.statusCode });
    }

    logger.error('unhandled_error', { requestId, path, method, error: message });
    return NextResponse.json({ error: 'Erro interno do servidor.', details: message }, { status: 500 });
  }
}


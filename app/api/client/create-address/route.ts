import { NextRequest, NextResponse } from 'next/server';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { ClientAddressService } from '@/modules/client/services/ClientAddressService';
import { AppError, DatabaseError, NotFoundError, ValidationError } from '@/modules/common/errors';
import { getLogger } from '@/modules/logger';

const logger = getLogger('api.client.create-address');

export async function POST(req: NextRequest) {
  const requestId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const path = '/api/client/create-address';
  const method = 'POST';
  try {
    const body = await req.json();
    logger.info('request_received', {
      requestId,
      path,
      method,
      hasBody: !!body,
    });

    const {
      street,
      number,
      neighborhood,
      city,
      state,
      zip_code,
      complement,
      is_collect_point,
      is_main_address,
    } = body ?? {};

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
    const inserted = await service.createAddress({
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

    logger.info('success', { requestId, path, method, userId: user.id, addressId: inserted?.id });
    return NextResponse.json({ success: true, message: 'Endereço criado com sucesso!', address: inserted });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    // Detect Supabase schema cache or migration mismatch related to new columns
    const schemaOutOfSync = /schema cache|is_collect_point|is_main_address/i.test(message);
    if (schemaOutOfSync) {
      logger.error('schema_out_of_sync', { requestId, path, method, code: 'SCHEMA_OUT_OF_SYNC', error: message });
      return NextResponse.json(
        {
          error: 'Estrutura do banco desatualizada. Aplique as migrations e atualize o cache do schema.',
          code: 'SCHEMA_OUT_OF_SYNC',
          hint: 'Execute as migrations (supabase db push) e redeploy para atualizar o schema cache.',
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


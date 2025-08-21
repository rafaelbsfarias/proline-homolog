import { NextResponse } from 'next/server';
import type { ILogger } from '@/modules/logger';
import { AppError, DatabaseError, NotFoundError, ValidationError } from '@/modules/common/errors';

interface Meta {
  requestId: string;
  path: string;
  method: string;
}

export function handleRouteError(error: unknown, logger: ILogger, meta: Meta) {
  const message = error instanceof Error ? error.message : String(error);

  if (/schema cache|is_collect_point|is_main_address/i.test(message)) {
    logger.error('schema_out_of_sync', { ...meta, code: 'SCHEMA_OUT_OF_SYNC', error: message });
    return NextResponse.json(
      {
        error: 'Estrutura do banco desatualizada. Aplique as migrations e atualize o cache do schema.',
        code: 'SCHEMA_OUT_OF_SYNC',
      },
      { status: 500 }
    );
  }

  if (error instanceof ValidationError) {
    logger.warn('validation_error', { ...meta, code: 'INVALID_INPUT', error: error.message });
    return NextResponse.json({ error: error.message, code: 'INVALID_INPUT' }, { status: 400 });
  }
  if (error instanceof NotFoundError) {
    logger.warn('access_denied', { ...meta, code: 'ACCESS_DENIED', error: error.message });
    return NextResponse.json({ error: error.message, code: 'ACCESS_DENIED' }, { status: 403 });
  }
  if (error instanceof DatabaseError) {
    logger.error('db_error', { ...meta, code: 'DATABASE_ERROR', error: error.message });
    return NextResponse.json({ error: error.message, code: 'DATABASE_ERROR' }, { status: 500 });
  }
  if (error instanceof AppError) {
    logger.error('app_error', { ...meta, code: 'APP_ERROR', error: error.message });
    return NextResponse.json({ error: error.message, code: 'APP_ERROR' }, { status: error.statusCode });
  }

  logger.error('unhandled_error', { ...meta, error: message });
  return NextResponse.json({ error: 'Erro interno do servidor.', details: message }, { status: 500 });
}


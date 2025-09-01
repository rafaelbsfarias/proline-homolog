import { NextResponse } from 'next/server';
import {
  AppError,
  DatabaseError,
  NotFoundError,
  ValidationError,
  ConflictError,
} from '@/modules/common/errors';

type JsonBody = Record<string, any>;

export function buildErrorPayload(error: unknown): { body: JsonBody; status: number } {
  if (error instanceof NotFoundError)
    return { body: { error: error.message, code: 'NOT_FOUND' }, status: error.statusCode };
  if (error instanceof ValidationError)
    return { body: { error: error.message, code: 'INVALID_INPUT' }, status: error.statusCode };
  if (error instanceof ConflictError)
    return { body: { error: error.message, code: 'CONFLICT' }, status: error.statusCode };
  if (error instanceof DatabaseError)
    return { body: { error: error.message, code: 'DATABASE_ERROR' }, status: error.statusCode };
  if (error instanceof AppError)
    return { body: { error: error.message, code: 'APP_ERROR' }, status: error.statusCode };

  const errorMessage = error instanceof Error ? error.message : String(error);
  return {
    body: { error: 'Erro interno do servidor.', code: 'INTERNAL_ERROR', details: errorMessage },
    status: 500,
  };
}

export function respondWithError(error: unknown) {
  const { body, status } = buildErrorPayload(error);
  return NextResponse.json(body, { status });
}

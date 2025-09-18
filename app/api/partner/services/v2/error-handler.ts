/**
 * Tratamento de erros específico para PartnerService API
 */

import { NextResponse } from 'next/server';
import type { Result } from '@/modules/common/types/domain';

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

// Mapeamento de nomes de erro para códigos e status HTTP
const ERROR_NAME_MAP: Record<string, { code: string; status: number }> = {
  ValidationError: { code: 'VALIDATION_ERROR', status: 400 },
  NotFoundError: { code: 'NOT_FOUND_ERROR', status: 404 },
  ConflictError: { code: 'CONFLICT_ERROR', status: 409 },
  UnauthorizedError: { code: 'UNAUTHORIZED_ERROR', status: 401 },
  ForbiddenError: { code: 'FORBIDDEN_ERROR', status: 403 },
  DatabaseError: { code: 'DATABASE_ERROR', status: 500 },
};

// Função para converter Result em resposta HTTP
export function handleServiceResult<T>(
  result: Result<T>,
  successStatus: number = 200
): NextResponse {
  if (result.success) {
    return NextResponse.json({ success: true, data: result.data }, { status: successStatus });
  }

  // Type narrowing: aqui sabemos que result tem success: false
  const failureResult = result as { readonly success: false; readonly error: Error };
  const errorName = failureResult.error?.name || 'Error';
  const errorMapping = ERROR_NAME_MAP[errorName] || { code: 'UNKNOWN_ERROR', status: 500 };

  const errorResponse: ApiErrorResponse = {
    success: false,
    error: {
      code: errorMapping.code,
      message: failureResult.error?.message || 'Erro interno do servidor',
    },
  };

  return NextResponse.json(errorResponse, { status: errorMapping.status });
}

// Função para tratamento de erros de validação do Zod
export function handleValidationError(error: unknown): NextResponse {
  const errorResponse: ApiErrorResponse = {
    success: false,
    error: {
      code: 'VALIDATION_ERROR',
      message: 'Dados de entrada inválidos',
      details: error instanceof Error ? error.message : String(error),
    },
  };

  return NextResponse.json(errorResponse, { status: 400 });
}

// Função para tratamento de erros gerais
export function handleApiError(): NextResponse {
  const errorResponse: ApiErrorResponse = {
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Erro interno do servidor',
    },
  };

  return NextResponse.json(errorResponse, { status: 500 });
}

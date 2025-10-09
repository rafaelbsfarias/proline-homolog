/**
 * HTTP Error Handlers - Módulo Comum
 *
 * Tratamento unificado de erros para APIs REST.
 * Converte Results, erros de validação e exceções genéricas em respostas HTTP padronizadas.
 *
 * @module common/http/errorHandlers
 * @see docs/partner/REFACTOR_PLAN_DRY_SOLID.md - Fase 1
 */

import { NextResponse } from 'next/server';
import type { Result } from '../types/domain';

/**
 * Estrutura padrão de resposta de erro da API
 */
export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/**
 * Estrutura de resposta de sucesso da API
 */
export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
}

/**
 * Mapeamento de tipos de erro para códigos HTTP e mensagens
 */
export interface ErrorMapping {
  code: string;
  status: number;
}

/**
 * Mapa padrão de erros conhecidos
 * Extensível para adicionar novos tipos de erro conforme necessário
 */
const ERROR_NAME_MAP: Record<string, ErrorMapping> = {
  ValidationError: { code: 'VALIDATION_ERROR', status: 400 },
  NotFoundError: { code: 'NOT_FOUND_ERROR', status: 404 },
  ConflictError: { code: 'CONFLICT_ERROR', status: 409 },
  UnauthorizedError: { code: 'UNAUTHORIZED_ERROR', status: 401 },
  ForbiddenError: { code: 'FORBIDDEN_ERROR', status: 403 },
  DatabaseError: { code: 'DATABASE_ERROR', status: 500 },
  TimeoutError: { code: 'TIMEOUT_ERROR', status: 504 },
  RateLimitError: { code: 'RATE_LIMIT_ERROR', status: 429 },
};

/**
 * Converte um Result<T> em uma resposta HTTP NextResponse
 *
 * @param result - Resultado da operação (success ou failure)
 * @param successStatus - Status HTTP para sucesso (padrão: 200)
 * @returns NextResponse com dados ou erro formatado
 *
 * @example
 * ```typescript
 * const result = await service.createUser(data);
 * return handleServiceResult(result, 201);
 * ```
 */
export function handleServiceResult<T>(
  result: Result<T>,
  successStatus: number = 200
): NextResponse<ApiSuccessResponse<T> | ApiErrorResponse> {
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

/**
 * Trata erros de validação (tipicamente de Zod ou outros validadores)
 *
 * @param error - Erro de validação (pode ser Error, ZodError, ou string)
 * @param details - Detalhes adicionais opcionais
 * @returns NextResponse com erro de validação formatado (400)
 *
 * @example
 * ```typescript
 * const validation = schema.safeParse(body);
 * if (!validation.success) {
 *   return handleValidationError(validation.error);
 * }
 * ```
 */
export function handleValidationError(
  error: unknown,
  details?: unknown
): NextResponse<ApiErrorResponse> {
  const errorResponse: ApiErrorResponse = {
    success: false,
    error: {
      code: 'VALIDATION_ERROR',
      message: 'Dados de entrada inválidos',
      details: details || (error instanceof Error ? error.message : String(error)),
    },
  };

  return NextResponse.json(errorResponse, { status: 400 });
}

/**
 * Trata erros genéricos/inesperados da API
 *
 * @param message - Mensagem de erro customizada (opcional)
 * @param statusCode - Status HTTP customizado (padrão: 500)
 * @returns NextResponse com erro interno formatado
 *
 * @example
 * ```typescript
 * try {
 *   // código que pode falhar
 * } catch (error) {
 *   logger.error('unexpected_error', error);
 *   return handleApiError();
 * }
 * ```
 */
export function handleApiError(
  message: string = 'Erro interno do servidor',
  statusCode: number = 500
): NextResponse<ApiErrorResponse> {
  const errorResponse: ApiErrorResponse = {
    success: false,
    error: {
      code: statusCode === 500 ? 'INTERNAL_ERROR' : 'API_ERROR',
      message,
    },
  };

  return NextResponse.json(errorResponse, { status: statusCode });
}

/**
 * Cria uma resposta de erro customizada
 * Útil para casos especiais não cobertos pelos handlers padrão
 *
 * @param code - Código do erro
 * @param message - Mensagem do erro
 * @param status - Status HTTP
 * @param details - Detalhes adicionais opcionais
 * @returns NextResponse com erro customizado
 *
 * @example
 * ```typescript
 * return createErrorResponse(
 *   'CUSTOM_ERROR',
 *   'Operação não suportada neste contexto',
 *   422,
 *   { supportedOperations: ['create', 'update'] }
 * );
 * ```
 */
export function createErrorResponse(
  code: string,
  message: string,
  status: number,
  details?: unknown
): NextResponse<ApiErrorResponse> {
  const errorResponse: ApiErrorResponse = {
    success: false,
    error: {
      code,
      message,
      details,
    },
  };

  return NextResponse.json(errorResponse, { status });
}

/**
 * Registra um novo tipo de erro no mapa global
 * Útil para módulos que precisam adicionar seus próprios tipos de erro
 *
 * @param errorName - Nome da classe de erro (ex: 'PaymentError')
 * @param mapping - Mapeamento para código e status HTTP
 *
 * @example
 * ```typescript
 * registerErrorMapping('PaymentError', {
 *   code: 'PAYMENT_FAILED',
 *   status: 402
 * });
 * ```
 */
export function registerErrorMapping(errorName: string, mapping: ErrorMapping): void {
  ERROR_NAME_MAP[errorName] = mapping;
}

/**
 * Obtém o mapeamento de um tipo de erro
 *
 * @param errorName - Nome da classe de erro
 * @returns Mapeamento do erro ou undefined se não encontrado
 */
export function getErrorMapping(errorName: string): ErrorMapping | undefined {
  return ERROR_NAME_MAP[errorName];
}

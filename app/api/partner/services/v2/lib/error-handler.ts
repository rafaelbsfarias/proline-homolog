/**
 * @deprecated Este módulo foi movido para @/modules/common/http/errorHandlers
 *
 * Mantenha imports atualizados:
 * OLD: import { handleServiceResult } from './lib/error-handler'
 * NEW: import { handleServiceResult } from '@/modules/common/http/errorHandlers'
 *
 * Este arquivo será removido na próxima versão.
 * @see modules/common/http/errorHandlers.ts
 */

export {
  handleServiceResult,
  handleValidationError,
  handleApiError,
  createErrorResponse,
  registerErrorMapping,
  getErrorMapping,
  type ApiErrorResponse,
  type ApiSuccessResponse,
  type ErrorMapping,
} from '@/modules/common/http/errorHandlers';

import { NextResponse } from 'next/server';
import {
  AuthError,
  ForbiddenError,
  NotFoundError,
  DomainError,
  ConflictError,
  ValidationError,
} from './errors';
import { getLogger, ILogger } from '@/modules/logger';
import { SYSTEM_MESSAGES, AUTH_MESSAGES } from '@/app/constants/messages';

const logger: ILogger = getLogger('ApiErrorHandlers');

export function handleApiError(error: unknown): NextResponse {
  // Validation errors (Bad Request)
  if (error instanceof ValidationError) {
    logger.warn('API Error: Validation Error', error);
    return NextResponse.json({ error: error.message, code: 'VALIDATION_ERROR' }, { status: 400 });
  }
  if (error instanceof AuthError) {
    logger.warn('API Error: Unauthorized', error);
    return NextResponse.json({ error: error.message, code: 'UNAUTHORIZED' }, { status: 401 });
  }
  if (error instanceof ForbiddenError) {
    logger.warn('API Error: Forbidden', error);
    return NextResponse.json({ error: error.message, code: 'FORBIDDEN' }, { status: 403 });
  }
  if (error instanceof NotFoundError) {
    logger.warn('API Error: Not Found', error);
    return NextResponse.json({ error: error.message, code: 'NOT_FOUND' }, { status: 404 });
  }
  if (error instanceof DomainError) {
    logger.warn('API Error: Domain Error', error);
    return NextResponse.json({ error: error.message, code: 'DOMAIN_ERROR' }, { status: 400 });
  }
  // Conflict (e.g., duplicated resources: email, document)
  if (error instanceof ConflictError) {
    logger.warn('API Error: Conflict', error);
    // Use the message provided by the domain/usecase to keep context-specific text
    return NextResponse.json({ error: error.message, code: 'CONFLICT' }, { status: 409 });
  }

  // For unhandled errors, log as critical
  const errorMessage = error instanceof Error ? error.message : String(error);
  logger.error('Unhandled API Error:', errorMessage, error);
  return NextResponse.json(
    { error: SYSTEM_MESSAGES.INTERNAL_ERROR, code: 'INTERNAL_ERROR' },
    { status: 500 }
  );
}

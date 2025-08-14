import { NextResponse } from 'next/server';
import { AuthError, ForbiddenError, NotFoundError, DomainError } from './errors';
import { getLogger, ILogger } from '@/modules/logger';
import { SYSTEM_MESSAGES } from '@/app/constants/messages';

const logger: ILogger = getLogger('ApiErrorHandlers');

export function handleApiError(error: unknown): NextResponse {
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

  // For unhandled errors, log as critical
  const errorMessage = error instanceof Error ? error.message : String(error);
  logger.error('Unhandled API Error:', errorMessage, error);
  return NextResponse.json(
    { error: SYSTEM_MESSAGES.INTERNAL_ERROR, code: 'INTERNAL_ERROR' },
    { status: 500 }
  );
}

/**
 * @deprecated Esta API está deprecada e será removida em breve.
 * Use POST /api/partner/checklist/load ao invés desta.
 *
 * Migração:
 * - Antes: GET /api/partner-checklist?vehicleId=xxx
 * - Depois: POST /api/partner/checklist/load com body { quoteId: xxx }
 */
import { NextResponse } from 'next/server';
import type { AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { withAnyAuth } from '@/modules/common/utils/authMiddleware';
import {
  handleGetPartnerChecklist,
  toHttpError,
  toHttpResponse,
} from '@/modules/partner/checklist/controller/partnerChecklistController';
import { getLogger } from '@/modules/logger';

const logger = getLogger('api:partner-checklist:deprecated');

export const GET = withAnyAuth(async (req: AuthenticatedRequest) => {
  // Log de uso da API deprecada
  logger.warn('deprecated_api_usage', {
    url: req.url,
    user: req.user?.id,
  });

  try {
    const { searchParams } = new URL(req.url);
    const result = await handleGetPartnerChecklist(searchParams);
    const http = toHttpResponse(result);

    // Adiciona header indicando deprecação
    const headers = new Headers();
    headers.set('X-API-Deprecated', 'true');
    headers.set('X-API-Deprecation-Info', 'Use POST /api/partner/checklist/load');

    return NextResponse.json(http.body, { status: http.status, headers });
  } catch (err) {
    const http = toHttpError(err);
    return NextResponse.json(http.body, { status: http.status });
  }
});

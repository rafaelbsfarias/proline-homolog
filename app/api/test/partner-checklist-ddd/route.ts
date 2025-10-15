/**
 * Rota de Teste para Controller DDD - Migração Gradual
 * Permite testar a nova arquitetura sem afetar produção
 */
import { NextResponse } from 'next/server';
import type { AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { withAnyAuth } from '@/modules/common/utils/authMiddleware';
import {
  handleGetPartnerChecklistDDD,
  toHttpError,
  toHttpResponse,
} from '@/modules/partner/checklist/controller/partnerChecklistControllerDDD';
import { getLogger } from '@/modules/logger';

const logger = getLogger('api:test:partner-checklist-ddd');

export const GET = withAnyAuth(async (req: AuthenticatedRequest) => {
  logger.info('test_ddd_controller_accessed', {
    url: req.url,
    user: req.user?.id,
  });

  try {
    const { searchParams } = new URL(req.url);
    const result = await handleGetPartnerChecklistDDD(searchParams);
    const http = toHttpResponse(result);

    // Adiciona header indicando que é versão DDD
    const headers = new Headers();
    headers.set('X-API-Version', 'DDD');
    headers.set('X-API-Architecture', 'Domain-Driven Design');

    return NextResponse.json(http.body, { status: http.status, headers });
  } catch (err) {
    const http = toHttpError(err);
    return NextResponse.json(http.body, { status: http.status });
  }
});

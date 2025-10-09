/**
 * @deprecated Este endpoint está depreciado e será removido em breve.
 *
 * **Use o novo endpoint V2:**
 * - GET /api/partner/services/v2?partnerId={id}
 *
 * **Mudanças no V2:**
 * - Usa arquitetura DDD com Application Service
 * - Cache inteligente
 * - Tratamento de erros padronizado
 * - Melhor validação com Zod
 *
 * **Timeline de remoção:** Sprint +2 (após migração completa dos hooks)
 *
 * @see app/api/partner/services/v2/route.ts
 * @see docs/partner/REFACTOR_PLAN_DRY_SOLID.md - Fase 3 (P1.2)
 */
import { NextResponse } from 'next/server';
import { withPartnerAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { handleApiError } from '@/lib/utils/apiErrorHandlers';
import { DatabaseError } from '@/lib/utils/errors';
import { getLogger } from '@/modules/logger';

const logger = getLogger('api:partner:list-services:legacy');

async function listPartnerServices(req: AuthenticatedRequest) {
  // Log de depreciação
  logger.warn('deprecated_endpoint_used', {
    endpoint: '/api/partner/list-services',
    partnerId: req.user.id,
    message: 'Este endpoint está depreciado. Use /api/partner/services/v2',
  });

  try {
    const partnerId = req.user.id;
    const supabase = SupabaseService.getInstance().getAdminClient();

    // A tabela correta, baseada nas migrações, é `partner_services`
    const { data, error } = await supabase
      .from('partner_services')
      .select('id, name, description, price, category')
      .eq('partner_id', partnerId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new DatabaseError(`Falha ao listar os serviços do parceiro: ${error.message}`);
    }

    // Header indicando depreciação
    const response = NextResponse.json(data);
    response.headers.set('X-Deprecated', 'true');
    response.headers.set('X-Deprecated-Replacement', '/api/partner/services/v2');
    response.headers.set('X-Deprecated-Removal-Date', '2025-12-01');

    return response;
  } catch (error) {
    return handleApiError(error);
  }
}

export const GET = withPartnerAuth(listPartnerServices);

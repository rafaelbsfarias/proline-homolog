/**
 * @deprecated Este endpoint está depreciado e será removido em breve.
 *
 * **Use o novo endpoint V2:**
 * - POST /api/partner/services/v2 (criar serviço)
 *
 * **Mudanças no V2:**
 * - Validação com Zod (schema rigoroso)
 * - Arquitetura DDD (Value Objects, Entidades)
 * - Tratamento de erros padronizado
 * - Retorna domain objects ao invés de DB raw
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
import { DatabaseError, ValidationError } from '@/lib/utils/errors';
import { getLogger } from '@/modules/logger';

const logger = getLogger('api:partner:services:legacy');

async function createServiceHandler(req: AuthenticatedRequest) {
  // Log de depreciação
  logger.warn('deprecated_endpoint_used', {
    endpoint: 'POST /api/partner/services',
    partnerId: req.user.id,
    message: 'Este endpoint está depreciado. Use POST /api/partner/services/v2',
  });

  try {
    const body = await req.json();
    const { name, description, price, category } = body;

    if (!name || !description || !price) {
      throw new ValidationError('Nome, descrição e preço são obrigatórios');
    }

    const serviceData: any = {
      name,
      description,
      price: Number(price),
      partner_id: req.user.id,
    };

    // Adiciona a categoria apenas se ela for fornecida e não for uma string vazia
    if (category && typeof category === 'string' && category.trim() !== '') {
      serviceData.category = category.trim();
    }

    const supabase = SupabaseService.getInstance().getAdminClient();

    const { data, error } = await supabase
      .from('partner_services') // Corrigido para a tabela correta
      .insert(serviceData)
      .select()
      .single();

    if (error) {
      throw new DatabaseError(`Erro ao criar serviço no banco de dados: ${error.message}`);
    }

    // Headers indicando depreciação
    const response = NextResponse.json({ success: true, service: data }, { status: 201 });
    response.headers.set('X-Deprecated', 'true');
    response.headers.set('X-Deprecated-Replacement', '/api/partner/services/v2');
    response.headers.set('X-Deprecated-Removal-Date', '2025-12-01');

    return response;
  } catch (error) {
    return handleApiError(error);
  }
}

export const POST = withPartnerAuth(createServiceHandler);

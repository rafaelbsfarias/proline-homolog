import { NextResponse } from 'next/server';
import { withPartnerAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { ChecklistService } from '@/modules/partner/services/ChecklistService';
import { getLogger } from '@/modules/logger';
import { z } from 'zod';

const logger = getLogger('api:partner:checklist:load');

// Schema de validação - aceita inspection_id (legacy) OU quote_id (novo)
const LoadChecklistSchema = z
  .object({
    inspectionId: z.string().uuid('inspectionId deve ser um UUID válido').optional(),
    quoteId: z.string().uuid('quoteId deve ser um UUID válido').optional(),
  })
  .refine(data => data.inspectionId || data.quoteId, {
    message: 'inspectionId ou quoteId deve ser fornecido',
  });

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function loadChecklistHandler(req: AuthenticatedRequest) {
  try {
    const body = await req.json();

    // Validação com Zod
    const validation = LoadChecklistSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Dados inválidos',
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }

    const { inspectionId, quoteId } = validation.data;
    const checklistService = ChecklistService.getInstance();

    // Carrega checklist com evidências e itens formatados
    // Passa ambos IDs, service decidirá qual usar
    const result = await checklistService.loadChecklistWithDetails(inspectionId, quoteId);

    if (!result.success) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 500 });
    }

    logger.info('load_ok', { inspection_id: inspectionId, quote_id: quoteId });
    return NextResponse.json({ ok: true, data: result.data });
  } catch (e) {
    const error = e as Error;
    logger.error('load_unexpected_error', { error: error.message || String(e) });
    return NextResponse.json({ ok: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export const POST = withPartnerAuth(loadChecklistHandler);

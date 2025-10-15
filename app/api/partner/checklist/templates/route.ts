import { NextResponse } from 'next/server';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { ChecklistTemplateService } from '@/modules/partner/services/checklist/templates/ChecklistTemplateService';
import { getLogger } from '@/modules/logger';

const logger = getLogger('api:partner:checklist:templates:list');

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/partner/checklist/templates
 *
 * Lista todos os templates disponíveis
 * Query params:
 * - activeOnly: boolean (default: true)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('activeOnly') !== 'false';

    logger.info('list_templates_request', { activeOnly });

    const supabase = SupabaseService.getInstance().getAdminClient();
    const templateService = new ChecklistTemplateService(supabase);

    const templates = await templateService.listTemplates(activeOnly);

    logger.info('list_templates_success', {
      count: templates.length,
      activeOnly,
    });

    return NextResponse.json({
      success: true,
      data: templates,
    });
  } catch (error) {
    logger.error('list_templates_error', {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { success: false, error: 'Erro ao listar templates' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { ChecklistTemplateService } from '@/modules/partner/services/checklist/templates/ChecklistTemplateService';
import { getLogger } from '@/modules/logger';

const logger = getLogger('api:partner:checklist:templates');

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/partner/checklist/templates/[category]
 *
 * Busca o template ativo para uma categoria específica
 */
export async function GET(request: Request, context: { params: Promise<{ category: string }> }) {
  try {
    const { category } = await context.params;

    logger.info('get_template_request', { category });

    const supabase = SupabaseService.getInstance().getAdminClient();
    const templateService = new ChecklistTemplateService(supabase);

    const template = await templateService.getActiveTemplateForCategory(category);

    if (!template) {
      logger.warn('template_not_found', { category });
      return NextResponse.json(
        {
          success: false,
          error: `Template não encontrado para categoria: ${category}`,
        },
        { status: 404 }
      );
    }

    // Agrupar itens por seção para facilitar renderização
    const sections = templateService.groupItemsBySection(template.items);

    logger.info('get_template_success', {
      category,
      template_id: template.id,
      sections_count: sections.length,
      items_count: template.items.length,
    });

    return NextResponse.json({
      success: true,
      data: {
        template: {
          id: template.id,
          category: template.category,
          version: template.version,
          title: template.title,
          description: template.description,
        },
        sections,
        items: template.items,
      },
    });
  } catch (error) {
    logger.error('get_template_error', {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json({ success: false, error: 'Erro ao buscar template' }, { status: 500 });
  }
}

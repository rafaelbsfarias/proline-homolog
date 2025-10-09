import { NextResponse } from 'next/server';
import { getLogger } from '@/modules/logger';
import { withPartnerAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { z } from 'zod';

const logger = getLogger('api:partner:checklist:init');

// Validação do corpo da requisição
const InitChecklistSchema = z.object({
  vehicleId: z.string().uuid('ID do veículo inválido'),
  quoteId: z.string().uuid('ID do orçamento inválido').optional(),
});

/**
 * Endpoint para registrar o início da fase orçamentária quando parceiro acessa o checklist
 * Atualiza status do veículo e cria registro na timeline (vehicle_history)
 */
async function initChecklistHandler(req: AuthenticatedRequest): Promise<NextResponse> {
  try {
    const body = await req.json();

    // Validar entrada
    const validation = InitChecklistSchema.safeParse(body);
    if (!validation.success) {
      logger.warn('validation_error', { errors: validation.error.errors });
      return NextResponse.json(
        { success: false, error: 'Dados inválidos', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { vehicleId, quoteId } = validation.data;
    const supabase = SupabaseService.getInstance().getAdminClient();
    const partnerId = req.user.id;

    logger.info('init_checklist_start', {
      vehicleId: vehicleId.slice(0, 8),
      partnerId: partnerId.slice(0, 8),
      quoteId: quoteId?.slice(0, 8),
    });

    // Buscar categoria do parceiro
    const { data: partnerCategories, error: categoryError } = await supabase.rpc(
      'get_partner_categories',
      { partner_id: partnerId }
    );

    if (categoryError) {
      logger.error('category_fetch_error', { error: categoryError.message });
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar categoria do parceiro' },
        { status: 500 }
      );
    }

    const categories = partnerCategories || [];
    const categoryName = categories[0] || 'Parceiro';

    // Status formatado para a timeline
    const timelineStatus = `Fase Orçamentária Iniciada - ${categoryName}`;

    // Verificar se já existe registro deste status na timeline
    const { data: existingHistory } = await supabase
      .from('vehicle_history')
      .select('id')
      .eq('vehicle_id', vehicleId)
      .eq('status', timelineStatus)
      .maybeSingle();

    // Se não existe, criar novo registro na timeline
    if (!existingHistory) {
      const { error: historyError } = await supabase.from('vehicle_history').insert({
        vehicle_id: vehicleId,
        status: timelineStatus,
        prevision_date: null,
        end_date: null,
        created_at: new Date().toISOString(),
      });

      if (historyError) {
        logger.error('history_insert_error', { error: historyError.message });
        // Não falhar a request por causa do histórico
      } else {
        logger.info('history_created', {
          vehicleId: vehicleId.slice(0, 8),
          status: timelineStatus,
        });
      }
    } else {
      logger.info('history_already_exists', { vehicleId: vehicleId.slice(0, 8) });
    }

    // Atualizar status do veículo se ainda estiver em "Análise Finalizada" ou "Em Análise"
    const { data: vehicle } = await supabase
      .from('vehicles')
      .select('status')
      .eq('id', vehicleId)
      .single();

    if (vehicle) {
      const currentStatus = vehicle.status;
      const shouldUpdate = ['Em Análise', 'Análise Finalizada', 'Aguardando Análise'].includes(
        currentStatus
      );

      if (shouldUpdate) {
        const { error: updateError } = await supabase
          .from('vehicles')
          .update({
            status: 'Em Orçamentação',
            updated_at: new Date().toISOString(),
          })
          .eq('id', vehicleId);

        if (updateError) {
          logger.error('vehicle_status_update_error', { error: updateError.message });
        } else {
          logger.info('vehicle_status_updated', {
            vehicleId: vehicleId.slice(0, 8),
            from: currentStatus,
            to: 'Em Orçamentação',
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Fase orçamentária iniciada com sucesso',
      status: timelineStatus,
    });
  } catch (error) {
    logger.error('init_checklist_error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export const POST = withPartnerAuth(initChecklistHandler);
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

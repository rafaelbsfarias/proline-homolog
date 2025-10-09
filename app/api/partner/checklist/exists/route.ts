import { NextResponse } from 'next/server';
import { withPartnerAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { getLogger } from '@/modules/logger';
import { z } from 'zod';

const logger = getLogger('api:partner:checklist:exists');

// Schema de validação
const ExistsChecklistSchema = z.object({
  quoteId: z.string().uuid('quoteId deve ser um UUID válido'),
});

async function existsChecklistHandler(req: AuthenticatedRequest) {
  try {
    const body = await req.json();

    // Validação com Zod
    const validation = ExistsChecklistSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Dados inválidos',
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }

    const { quoteId } = validation.data;
    const partnerId = req.user.id;

    const supabase = SupabaseService.getInstance().getAdminClient();

    logger.info('checking_checklist_existence', {
      quote_id: quoteId,
      partner_id: partnerId,
    });

    // Buscar o vehicle_id através da quote (forma robusta, objeto ou array)
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .select(
        `
        id,
        service_order_id,
        service_orders!inner (
          id,
          vehicle_id
        )
      `
      )
      .eq('id', quoteId)
      .eq('partner_id', partnerId)
      .single();

    if (quoteError || !quote) {
      logger.warn('quote_not_found', {
        quote_id: quoteId,
        partner_id: partnerId,
        error: quoteError?.message,
      });
      return NextResponse.json({ hasChecklist: false });
    }

    // Type-safe extraction
    const serviceOrders = quote.service_orders as unknown as
      | { vehicle_id: string }
      | { vehicle_id: string }[];
    const vehicleId: string | undefined = Array.isArray(serviceOrders)
      ? serviceOrders[0]?.vehicle_id
      : serviceOrders?.vehicle_id;

    if (!vehicleId) {
      logger.warn('vehicle_id_not_found', { quote_id: quoteId });
      return NextResponse.json({ hasChecklist: false });
    }

    // Verificar se existe pelo menos um checklist com status 'submitted' para este veículo
    const { data: rows, error: checklistError } = await supabase
      .from('mechanics_checklist')
      .select('id')
      .eq('vehicle_id', vehicleId)
      .eq('status', 'submitted')
      .limit(1);

    if (checklistError) {
      logger.error('checklist_check_error', {
        error: checklistError.message,
        vehicle_id: vehicleId,
      });
      return NextResponse.json({ hasChecklist: false });
    }

    const hasSubmittedChecklist = Array.isArray(rows) && rows.length > 0;

    logger.info('checklist_existence_checked', {
      quote_id: quoteId,
      vehicle_id: vehicleId,
      has_checklist: hasSubmittedChecklist,
    });

    return NextResponse.json({ hasChecklist: hasSubmittedChecklist });
  } catch (error) {
    logger.error('exists_unexpected_error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ hasChecklist: false });
  }
}

export const POST = withPartnerAuth(existsChecklistHandler);

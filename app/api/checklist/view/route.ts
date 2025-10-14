import { NextResponse } from 'next/server';
import { withAnyAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { ChecklistService } from '@/modules/partner/services/ChecklistService';
import { getLogger } from '@/modules/logger';
import { z } from 'zod';

const logger = getLogger('api:checklist:view');

// Schema de validação
const ViewChecklistSchema = z.object({
  vehicle_id: z.string().uuid('vehicle_id deve ser um UUID válido'),
  inspection_id: z.string().uuid('inspection_id deve ser um UUID válido').optional(),
  quote_id: z.string().uuid('quote_id deve ser um UUID válido').optional(),
  partner_category: z.string().optional(), // Categoria do parceiro para filtrar
  partner_id: z.string().uuid('partner_id deve ser um UUID válido').optional(),
});

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function viewChecklistHandler(req: AuthenticatedRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const vehicle_id = searchParams.get('vehicle_id') || undefined;
    const inspection_id = searchParams.get('inspection_id') || undefined;
    const quote_id = searchParams.get('quote_id') || undefined;
    const partner_category = searchParams.get('partner_category') || undefined;
    const partner_id = searchParams.get('partner_id') || undefined;

    logger.info('view_checklist_request', {
      vehicle_id,
      inspection_id,
      quote_id,
      partner_category,
      user_id: req.user.id,
      user_role: req.user.role,
    });

    // Validação com Zod
    const validation = ViewChecklistSchema.safeParse({
      vehicle_id,
      inspection_id,
      quote_id,
      partner_category,
      partner_id,
    });

    if (!validation.success) {
      logger.error('validation_failed', {
        errors: validation.error.errors,
        input: { vehicle_id, inspection_id, quote_id, partner_category, partner_id },
      });
      return NextResponse.json(
        {
          success: false,
          error: 'Parâmetros inválidos',
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }

    const {
      vehicle_id: validVehicleId,
      inspection_id: validInspectionId,
      quote_id: validQuoteId,
      partner_category: validPartnerCategory,
      partner_id: validPartnerId,
    } = validation.data;

    const checklistService = ChecklistService.getInstance();
    const supabase = checklistService['supabase'];

    // Admin e Specialist podem ver qualquer veículo
    // Cliente só pode ver seus próprios veículos
    if (req.user.role === 'client') {
      const { data: vehicle, error: vehicleError } = await supabase
        .from('vehicles')
        .select('id, client_id')
        .eq('id', validVehicleId)
        .single();

      if (vehicleError || !vehicle) {
        logger.error('vehicle_not_found', { vehicle_id: validVehicleId, error: vehicleError });
        return NextResponse.json(
          { success: false, error: 'Veículo não encontrado' },
          { status: 404 }
        );
      }

      if (vehicle.client_id !== req.user.id) {
        logger.error('unauthorized_access', {
          vehicle_id: validVehicleId,
          client_id: req.user.id,
          vehicle_owner: vehicle.client_id,
        });
        return NextResponse.json(
          { success: false, error: 'Você não tem permissão para visualizar este checklist' },
          { status: 403 }
        );
      }
    }

    // Carregar formulário (itens) e anomalias
    const details = await checklistService.loadChecklistWithDetails(
      validInspectionId || null,
      validQuoteId || null,
      validPartnerId
    );
    const anomaliesRes = await checklistService.loadAnomaliesWithSignedUrls(
      validInspectionId || null,
      validVehicleId,
      validQuoteId || null,
      validPartnerId
    );

    if (!anomaliesRes.success) {
      logger.error('load_anomalies_service_error', {
        error: anomaliesRes.error,
        vehicle_id: validVehicleId,
      });
      return NextResponse.json({ success: false, error: anomaliesRes.error }, { status: 500 });
    }

    const form = details.success ? details.data?.form || {} : {};
    const filteredData = anomaliesRes.data;

    logger.info('view_checklist_success', {
      vehicle_id: validVehicleId,
      anomalies_count: filteredData?.length || 0,
      partner_category: validPartnerCategory,
    });

    return NextResponse.json({
      success: true,
      data: { form, anomalies: filteredData },
      partner_category: validPartnerCategory,
    });
  } catch (e) {
    const error = e as Error;
    logger.error('view_checklist_unexpected_error', {
      error: error.message || String(e),
    });
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export const GET = withAnyAuth(viewChecklistHandler);

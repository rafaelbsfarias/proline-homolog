import { NextResponse } from 'next/server';
import { withPartnerAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { ChecklistService } from '@/modules/partner/services/ChecklistService';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { getLogger } from '@/modules/logger';
import { z } from 'zod';

const logger = getLogger('api:partner:checklist:load-anomalies');

// Schema de validação - aceita inspection_id (legacy) OU quote_id (novo)
const LoadAnomaliesSchema = z
  .object({
    inspection_id: z.string().uuid('inspection_id deve ser um UUID válido').optional(),
    quote_id: z.string().uuid('quote_id deve ser um UUID válido').optional(),
    vehicle_id: z.string().uuid('vehicle_id deve ser um UUID válido'),
  })
  .refine(data => data.inspection_id || data.quote_id, {
    message: 'inspection_id ou quote_id deve ser fornecido',
    path: ['inspection_id', 'quote_id'],
  });

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function loadAnomaliesHandler(req: AuthenticatedRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const inspection_id = searchParams.get('inspection_id') || undefined;
    const quote_id = searchParams.get('quote_id') || undefined;
    const vehicle_id = searchParams.get('vehicle_id') || undefined;

    logger.info('load_anomalies_request', {
      inspection_id,
      quote_id,
      vehicle_id,
      has_inspection_id: !!inspection_id,
      has_quote_id: !!quote_id,
      has_vehicle_id: !!vehicle_id,
    });

    // Validação com Zod
    const validation = LoadAnomaliesSchema.safeParse({
      inspection_id,
      quote_id,
      vehicle_id,
    });

    if (!validation.success) {
      logger.error('validation_failed', {
        errors: validation.error.errors,
        input: { inspection_id, quote_id, vehicle_id },
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
      inspection_id: validInspectionId,
      quote_id: validQuoteId,
      vehicle_id: validVehicleId,
    } = validation.data;
    const partnerId = req.user.id;

    logger.info('load_anomalies_start', {
      inspection_id: validInspectionId,
      quote_id: validQuoteId,
      vehicle_id: validVehicleId,
      partner_id: partnerId,
    });

    const checklistService = ChecklistService.getInstance();

    // Access control: garantir que o parceiro tem acesso
    // 1) Se existir mechanics_checklist com os IDs fornecidos, ele deve pertencer ao partner
    // 2) Caso não exista, validar se há quote do partner para o vehicle_id
    const supabase = SupabaseService.getInstance().getAdminClient();
    let ownershipOk = false;
    try {
      if (validQuoteId || validInspectionId) {
        let q = supabase.from('mechanics_checklist').select('id, partner_id').limit(1);
        if (validQuoteId) q = q.eq('quote_id', validQuoteId);
        if (validInspectionId) q = q.eq('inspection_id', validInspectionId);
        const { data: chk } = await q.maybeSingle();
        if (chk?.partner_id) {
          ownershipOk = chk.partner_id === partnerId;
        }
      }
      if (!ownershipOk) {
        const { data: accessCheck } = await supabase
          .from('quotes')
          .select(`id, service_orders!inner(vehicle_id)`)
          .eq('partner_id', partnerId)
          .eq('service_orders.vehicle_id', validVehicleId)
          .limit(1);
        ownershipOk = Array.isArray(accessCheck) && accessCheck.length > 0;
      }
    } catch (ace) {
      logger.warn('access_check_error', {
        error: ace instanceof Error ? ace.message : String(ace),
      });
    }

    if (!ownershipOk) {
      return NextResponse.json(
        { success: false, error: 'Acesso negado a anomalias deste veículo' },
        { status: 403 }
      );
    }
    const result = await checklistService.loadAnomaliesWithSignedUrls(
      validInspectionId || null,
      validVehicleId,
      validQuoteId || null
    );

    if (!result.success) {
      logger.error('load_anomalies_service_error', {
        error: result.error,
        inspection_id: validInspectionId,
        quote_id: validQuoteId,
        vehicle_id: validVehicleId,
      });
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }

    logger.info('load_anomalies_success', {
      count: result.data?.length || 0,
      has_part_requests: result.data?.some(a => a.partRequest) || false,
      sample_anomaly: result.data?.[0],
      inspection_id: validInspectionId,
      quote_id: validQuoteId,
      vehicle_id: validVehicleId,
    });

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (e) {
    const error = e as Error;
    logger.error('load_anomalies_unexpected_error', {
      error: error.message || String(e),
    });
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export const GET = withPartnerAuth(loadAnomaliesHandler);

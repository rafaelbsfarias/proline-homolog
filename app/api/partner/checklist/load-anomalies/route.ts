import { NextResponse } from 'next/server';
import { withPartnerAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { ChecklistService } from '@/modules/partner/services/ChecklistService';
import { getLogger } from '@/modules/logger';
import { z } from 'zod';

const logger = getLogger('api:partner:checklist:load-anomalies');

// Schema de validação
const LoadAnomaliesSchema = z.object({
  inspection_id: z.string().uuid('inspection_id deve ser um UUID válido'),
  vehicle_id: z.string().uuid('vehicle_id deve ser um UUID válido'),
});

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function loadAnomaliesHandler(req: AuthenticatedRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const inspection_id = searchParams.get('inspection_id');
    const vehicle_id = searchParams.get('vehicle_id');

    // Validação com Zod
    const validation = LoadAnomaliesSchema.safeParse({
      inspection_id,
      vehicle_id,
    });

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Parâmetros inválidos',
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }

    const { inspection_id: validInspectionId, vehicle_id: validVehicleId } = validation.data;
    const partnerId = req.user.id;

    logger.info('load_anomalies_start', {
      inspection_id: validInspectionId,
      vehicle_id: validVehicleId,
      partner_id: partnerId,
    });

    const checklistService = ChecklistService.getInstance();
    const result = await checklistService.loadAnomaliesWithSignedUrls(
      validInspectionId,
      validVehicleId
    );

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }

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

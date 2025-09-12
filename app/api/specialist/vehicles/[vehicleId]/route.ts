import { NextResponse } from 'next/server';
import {
  withSpecialistAuth,
  type AuthenticatedRequest,
} from '@/modules/common/utils/authMiddleware';
import { GetVehicleDetailsById } from '@/modules/vehicles/application/GetVehicleDetailsById';
import { getLogger } from '@/modules/logger';

const logger = getLogger('api:specialist:vehicle-details');

export const GET = withSpecialistAuth(async (req: AuthenticatedRequest, ctx) => {
  try {
    const { vehicleId } = await (ctx as any).params;
    logger.info('request', { spec: req.user.id.slice(0, 8), vehicleId: vehicleId.slice(0, 8) });
    const v = await GetVehicleDetailsById(vehicleId, { role: 'specialist', userId: req.user.id });
    if (!v) return NextResponse.json({ error: 'Veículo não encontrado' }, { status: 404 });
    return NextResponse.json({ success: true, vehicle: v });
  } catch (e: any) {
    logger.error('error', e?.message || e);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
});

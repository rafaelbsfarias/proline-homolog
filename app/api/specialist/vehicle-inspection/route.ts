import { NextResponse } from 'next/server';
import {
  withSpecialistAuth,
  type AuthenticatedRequest,
} from '@/modules/common/utils/authMiddleware';
import { GetVehicleInspection } from '@/modules/vehicles/application/GetVehicleInspection';

export const GET = withSpecialistAuth(async (req: AuthenticatedRequest) => {
  try {
    const url = new URL(req.url);
    const vehicleId = url.searchParams.get('vehicleId') || '';
    if (!vehicleId) return NextResponse.json({ error: 'vehicleId requerido' }, { status: 400 });
    const inspection = await GetVehicleInspection(vehicleId, {
      role: 'specialist',
      userId: req.user.id,
    });
    return NextResponse.json({ success: true, inspection });
  } catch {
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
});

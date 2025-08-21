import { NextResponse } from 'next/server';
import {
  withSpecialistAuth,
  type AuthenticatedRequest,
} from '@/modules/common/utils/authMiddleware';
import { validateUUID } from '@/modules/common/utils/inputSanitization';
import { authorizeSpecialistForVehicle } from './authorization';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import type { SupabaseClient } from '@supabase/supabase-js';

interface ActionHandlerParams {
  vehicleId: string;
  supabase: SupabaseClient;
  body: any; // The parsed JSON body
  req: AuthenticatedRequest;
}

interface ActionResult {
  json: object;
  status: number;
}

type VehicleActionHandler = (params: ActionHandlerParams) => Promise<ActionResult>;

export const createVehicleActionHandler = (handler: VehicleActionHandler) => {
  return withSpecialistAuth(async (req: AuthenticatedRequest) => {
    let body: any;
    try {
      body = await req.json();
    } catch (e) {
      return NextResponse.json({ error: 'Corpo da requisição inválido' }, { status: 400 });
    }

    try {
      const vehicleId = String(body?.vehicleId || '');

      if (!validateUUID(vehicleId)) {
        return NextResponse.json({ error: 'vehicleId inválido' }, { status: 400 });
      }

      const authResult = await authorizeSpecialistForVehicle(req.user.id, vehicleId);
      if (!authResult.authorized) {
        return NextResponse.json({ error: authResult.error }, { status: authResult.status });
      }

      const supabase = SupabaseService.getInstance().getAdminClient();
      const { json, status } = await handler({ vehicleId, supabase, body, req });

      return NextResponse.json(json, { status });
    } catch (e) {
      console.error(`Error in vehicle action handler for vehicleId ${body?.vehicleId}:`, e);
      const message = e instanceof Error ? e.message : 'Erro interno do servidor.';
      return NextResponse.json({ error: message }, { status: 500 });
    }
  });
};

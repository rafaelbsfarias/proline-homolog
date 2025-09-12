import { NextResponse } from 'next/server';
import {
  withSpecialistAuth,
  type AuthenticatedRequest,
} from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { getLogger } from '@/modules/logger';

const logger = getLogger('api:specialist:my-vehicles');

export const GET = withSpecialistAuth(async (req: AuthenticatedRequest) => {
  try {
    const supabase = SupabaseService.getInstance().getAdminClient();

    // 1) Find all client links for this specialist
    const { data: links, error: linkErr } = await supabase
      .from('client_specialists')
      .select('client_id')
      .eq('specialist_id', req.user.id);

    if (linkErr) {
      logger.error('links_error', linkErr);
      return NextResponse.json({ error: 'Erro ao buscar vínculos' }, { status: 500 });
    }

    const clientIds = (links || []).map((l: any) => l.client_id).filter(Boolean);
    if (clientIds.length === 0) {
      return NextResponse.json({ success: true, vehicles: [] });
    }

    // 2) Fetch vehicles for those clients (basic fields for dashboard cards)
    const { data: vehicles, error: vehErr } = await supabase
      .from('vehicles')
      .select('id, client_id, brand, model, year, plate, color, status')
      .in('client_id', clientIds)
      .order('created_at', { ascending: false })
      .limit(200);

    if (vehErr) {
      logger.error('vehicles_error', vehErr);
      return NextResponse.json({ error: 'Erro ao buscar veículos' }, { status: 500 });
    }

    return NextResponse.json({ success: true, vehicles: vehicles || [] });
  } catch (e: any) {
    logger.error('unhandled', e?.message || e);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
});

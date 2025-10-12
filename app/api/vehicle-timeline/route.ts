import { NextResponse } from 'next/server';
import { createClient as createServerSupabase } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { getLogger } from '@/modules/logger';
import { withClientAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import {
  getBudgetStartedEvents,
  getBudgetApprovedEvents,
} from '@/modules/vehicles/timeline/VehicleTimelineService';
import type { TimelineEvent } from '@/modules/vehicles/timeline/types';

const logger = getLogger('api:vehicle-timeline');

export const GET = withClientAuth(async (req: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const vehicleId = searchParams.get('vehicleId');
    if (!vehicleId) {
      return NextResponse.json(
        { success: false, error: 'vehicleId é obrigatório' },
        { status: 400 }
      );
    }

    // Criar cliente com o token Bearer para respeitar RLS do usuário
    const authHeader = req.headers.get('authorization') || '';
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Timeline unificada: incluir eventos de orçamentação iniciada e aprovada
    const [budgetEvents, approvedEvents] = await Promise.all([
      getBudgetStartedEvents(supabase, vehicleId, logger),
      getBudgetApprovedEvents(supabase, vehicleId, logger),
    ]);
    const events: TimelineEvent[] = [...budgetEvents, ...approvedEvents].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    return NextResponse.json({ success: true, events });
  } catch (e) {
    logger.error('vehicle_timeline_error', { e });
    return NextResponse.json({ success: false, error: 'Erro ao obter timeline' }, { status: 500 });
  }
});

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

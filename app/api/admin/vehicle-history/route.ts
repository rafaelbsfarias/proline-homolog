import { NextResponse } from 'next/server';
import { withAdminAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { createClient } from '@/lib/supabase/server';
import { getLogger } from '@/modules/logger';

const logger = getLogger('api:admin:vehicle-history');

export const GET = withAdminAuth(async (req: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const vehicleId = searchParams.get('vehicleId');

    if (!vehicleId) {
      return NextResponse.json(
        { success: false, error: 'vehicleId é obrigatório' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data: history, error: historyError } = await supabase
      .from('vehicle_history')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .order('created_at', { ascending: true });

    if (historyError) {
      logger.error('history_fetch_error', { error: historyError.message });
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar histórico do veículo' },
        { status: 500 }
      );
    }

    logger.info('history_fetched', {
      vehicleId: vehicleId.slice(0, 8),
      count: history?.length || 0,
      by: 'admin',
    });

    return NextResponse.json({ success: true, history: history || [] });
  } catch (error) {
    logger.error('unexpected_error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
});

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

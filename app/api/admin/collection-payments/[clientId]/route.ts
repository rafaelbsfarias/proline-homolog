import { NextResponse } from 'next/server';
import { withAdminAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { getLogger } from '@/modules/logger';

const logger = getLogger('api:admin:collection-payments');

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const GET = withAdminAuth(async (req: AuthenticatedRequest, ctx: any) => {
  try {
    const { clientId } = (ctx as any).params || {};
    if (!clientId)
      return NextResponse.json({ success: false, error: 'Cliente inválido' }, { status: 400 });

    const admin = SupabaseService.getInstance().getAdminClient();

    // Carregar registros de vehicle_collections com status 'paid'
    const { data: rows, error } = await admin
      .from('vehicle_collections')
      .select('collection_address, collection_fee_per_vehicle, updated_at')
      .eq('client_id', clientId)
      .eq('status', 'paid');

    if (error) {
      logger.error('paid-list-error', { error: error.message });
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar pagamentos' },
        { status: 500 }
      );
    }

    // Para cada address label, contar veículos (opcional; aproximado)
    // Aqui mantemos só o fee por veículo e o endereço para exibição
    const payments = (rows || []).map((r: any) => ({
      address: r.collection_address,
      fee: r.collection_fee_per_vehicle,
      paid_at: r.updated_at,
    }));

    return NextResponse.json({ success: true, payments });
  } catch (e: any) {
    logger.error('unhandled', { error: e?.message });
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
});

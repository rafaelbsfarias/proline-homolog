import { NextResponse } from 'next/server';
import { withClientAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { getLogger } from '@/modules/logger';

const logger = getLogger('api:client:approve-collection');

export const POST = withClientAuth(async (req: AuthenticatedRequest) => {
  try {
    const { collection_id } = await req.json();
    const clientId = req.user.id;

    if (!collection_id) {
      return NextResponse.json({ success: false, error: 'collection_id é obrigatório' }, { status: 400 });
    }

    const supabase = SupabaseService.getInstance().getAdminClient();

    // Update vehicles status
    const { error: vehicleError } = await supabase
      .from('vehicles')
      .update({ status: 'AGUARDANDO COLETA' })
      .eq('collection_id', collection_id)
      .eq('client_id', clientId);

    if (vehicleError) {
      logger.error('vehicle_update_error', { error: vehicleError.message });
      return NextResponse.json({ success: false, error: 'Erro ao atualizar veículos' }, { status: 500 });
    }

    // Update collection status
    const { error: collectionError } = await supabase
      .from('vehicle_collections')
      .update({ status: 'approved' })
      .eq('id', collection_id);

    if (collectionError) {
      logger.error('collection_update_error', { error: collectionError.message });
      return NextResponse.json({ success: false, error: 'Erro ao aprovar coleta' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (e: any) {
    logger.error('unhandled', { error: e?.message });
    return NextResponse.json({ success: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
});

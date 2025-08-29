import { NextResponse } from 'next/server';
import { withAdminAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { getLogger } from '@/modules/logger';
import { STATUS } from '@/modules/common/constants/status';

const logger = getLogger('api:admin:propose-collection-date');

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const POST = withAdminAuth(async (req: AuthenticatedRequest) => {
  try {
    const body = await req.json();
    const clientId: string | undefined = body?.clientId;
    const addressId: string | undefined = body?.addressId;
    const new_date: string | undefined = body?.new_date;
    if (!clientId || !addressId || !new_date) {
      return NextResponse.json(
        { success: false, error: 'clientId, addressId e new_date são obrigatórios' },
        { status: 400 }
      );
    }

    const admin = SupabaseService.getInstance().getAdminClient();

    // 1) Obter label do endereço
    const { data: addr, error: addrErr } = await admin
      .from('addresses')
      .select('id, street, number, city')
      .eq('id', addressId)
      .maybeSingle();
    if (addrErr || !addr) {
      return NextResponse.json({ success: false, error: 'Endereço inválido' }, { status: 400 });
    }
    const label = (a: any) =>
      `${a?.street || ''}${a?.number ? ', ' + a.number : ''}${a?.city ? ' - ' + a.city : ''}`.trim();
    const addressLabel = label(addr);

    // 2) Verificar existência de precificação (fee) antes de permitir propor data
    // Mantém status como 'requested' (aguardando aprovação do cliente)
    const { data: vcRow, error: vcErr } = await admin
      .from('vehicle_collections')
      .select('id, collection_fee_per_vehicle')
      .eq('client_id', clientId)
      .eq('collection_address', addressLabel)
      .eq('status', 'requested')
      .maybeSingle();
    if (vcErr) {
      logger.warn('load_collection_failed', { error: vcErr.message, clientId, addressLabel });
    }

    // Regra: só permite propor data se já existir uma coleção com fee definido (> 0)
    const hasFee =
      typeof vcRow?.collection_fee_per_vehicle === 'number' && vcRow.collection_fee_per_vehicle > 0;
    if (!vcRow?.id || !hasFee) {
      return NextResponse.json(
        { success: false, error: 'Precifique o endereço antes de propor uma data de coleta.' },
        { status: 400 }
      );
    }

    // 3) Atualizar proposta de data na vehicle_collections existente
    if (vcRow?.id) {
      const { error } = await admin
        .from('vehicle_collections')
        .update({ collection_date: new_date })
        .eq('id', vcRow.id);
      if (error) {
        logger.error('update_collection_failed', { error: error.message, clientId, addressLabel });
        return NextResponse.json(
          { success: false, error: 'Falha ao atualizar proposta' },
          { status: 500 }
        );
      }
    }

    // 4) Atualizar veículos do cliente nesse endereço para indicar que há solicitação de mudança
    // Não alteramos a estimated_arrival_date aqui — a nova data fica registrada na collection.
    const allowedPrev = [STATUS.PONTO_COLETA_SELECIONADO, STATUS.AGUARDANDO_APROVACAO];
    const { error: vehErr } = await admin
      .from('vehicles')
      .update({ status: STATUS.SOLICITACAO_MUDANCA_DATA })
      .eq('client_id', clientId)
      .eq('pickup_address_id', addressId)
      .in('status', allowedPrev);
    if (vehErr) {
      logger.error('vehicles_update_failed', { error: vehErr.message, clientId, addressId });
      return NextResponse.json(
        { success: false, error: 'Erro ao atualizar veículos' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    logger.error('unhandled', { error: e?.message });
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
});

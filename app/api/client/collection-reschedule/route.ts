import { NextResponse } from 'next/server';
import { withClientAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { getLogger } from '@/modules/logger';
import { STATUS } from '@/modules/common/constants/status';

const logger = getLogger('api:client:collection-reschedule');

function labelAddress(a: any) {
  const street = a?.street?.trim() || '';
  const number = a?.number ? `, ${a.number}` : '';
  const city = a?.city ? ` - ${a.city}` : '';
  return `${street}${number}${city}`.trim();
}

export const POST = withClientAuth(async (req: AuthenticatedRequest) => {
  try {
    const userId = req.user.id;
    const { addressId, new_date } = await req.json();
    if (!addressId || !new_date) {
      return NextResponse.json({ error: 'addressId e new_date são obrigatórios' }, { status: 400 });
    }

    const admin = SupabaseService.getInstance().getAdminClient();

    // 1) Pegar label do endereço
    const { data: addr, error: aerr } = await admin
      .from('addresses')
      .select('id, street, number, city')
      .eq('id', addressId)
      .maybeSingle();

    if (aerr || !addr) {
      return NextResponse.json({ error: 'Endereço inválido' }, { status: 400 });
    }
    const addressLabel = labelAddress(addr);

    // 2) Atualizar veículos do cliente nesse endereço
    const allowedPrev = [STATUS.AGUARDANDO_APROVACAO, STATUS.APROVACAO_NOVA_DATA];
    const { error: vehErr } = await admin
      .from('vehicles')
      .update({ estimated_arrival_date: new_date, status: STATUS.APROVACAO_NOVA_DATA })
      .eq('client_id', userId)
      .eq('pickup_address_id', addressId)
      .in('status', allowedPrev);

    if (vehErr) {
      logger.error('veh-update', { error: vehErr.message });
      return NextResponse.json({ error: 'Erro ao atualizar veículos' }, { status: 500 });
    }

    // 3) Upsert em vehicle_collections para evitar violação de unique constraint
    // Unique key: (client_id, collection_address, collection_date)
    const { error: upsertErr } = await admin.from('vehicle_collections').upsert(
      {
        client_id: userId,
        collection_address: addressLabel,
        collection_date: new_date,
        status: STATUS.REQUESTED,
      },
      { onConflict: 'client_id,collection_address,collection_date' }
    );
    if (upsertErr) {
      logger.error('vc-upsert', { error: upsertErr.message });
      return NextResponse.json({ error: 'Erro ao salvar reagendamento' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    logger.error('unhandled', { error: e?.message });
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
  }
});

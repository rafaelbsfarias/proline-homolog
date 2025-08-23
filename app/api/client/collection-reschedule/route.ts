import { NextResponse } from 'next/server';
import { withClientAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { getLogger } from '@/modules/logger';

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
    const allowedPrev = ['AGUARDANDO APROVAÇÃO DA COLETA', 'APROVAÇÃO NOVA DATA'];
    const { error: vehErr } = await admin
      .from('vehicles')
      .update({ estimated_arrival_date: new_date, status: 'APROVAÇÃO NOVA DATA' })
      .eq('client_id', userId)
      .eq('pickup_address_id', addressId)
      .in('status', allowedPrev);

    if (vehErr) {
      logger.error('veh-update', { error: vehErr.message });
      return NextResponse.json({ error: 'Erro ao atualizar veículos' }, { status: 500 });
    }

    // 3) Atualizar/Inserir em vehicle_collections
    const { data: vcRow } = await admin
      .from('vehicle_collections')
      .select('id')
      .eq('client_id', userId)
      .eq('collection_address', addressLabel)
      .maybeSingle();

    if (vcRow?.id) {
      const { error } = await admin
        .from('vehicle_collections')
        .update({ collection_date: new_date, status: 'requested' })
        .eq('id', vcRow.id);
      if (error) throw error;
    } else {
      const { error } = await admin.from('vehicle_collections').insert({
        client_id: userId,
        collection_address: addressLabel,
        collection_date: new_date,
        status: 'requested',
      });
      if (error) throw error;
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    logger.error('unhandled', { error: e?.message });
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
  }
});

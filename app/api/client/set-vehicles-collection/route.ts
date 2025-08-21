import { NextRequest, NextResponse } from 'next/server';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { getLogger } from '@/modules/logger';

const logger = getLogger('api.client.set-vehicles-collection');

type Method = 'collect_point' | 'bring_to_yard';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { method, addressId, estimated_arrival_date, vehicleIds } = body as {
      method: Method;
      addressId?: string;
      estimated_arrival_date?: string;
      vehicleIds?: string[];
    };

    if (!method || (method !== 'collect_point' && method !== 'bring_to_yard')) {
      return NextResponse.json({ error: 'Método inválido' }, { status: 400 });
    }

    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token de autorização não fornecido.' }, { status: 401 });
    }
    const token = authHeader.substring(7);
    const supabaseClient = SupabaseService.getInstance().getClient();
    const admin = SupabaseService.getInstance().getAdminClient();

    const { data: userData, error: userErr } = await supabaseClient.auth.getUser(token);
    if (userErr || !userData.user) {
      return NextResponse.json({ error: 'Usuário não autenticado ou inválido.' }, { status: 401 });
    }
    const userId = userData.user.id;

    // Resolve vehicles to update (provided list or all client vehicles)
    let ids: string[] = vehicleIds ?? [];
    if (!ids.length) {
      const { data: allVehicles, error: vehErr } = await admin
        .from('vehicles')
        .select('id')
        .eq('client_id', userId);
      if (vehErr) {
        logger.error('list-vehicles-error', { error: vehErr.message });
        return NextResponse.json({ error: 'Erro ao listar veículos' }, { status: 500 });
      }
      ids = (allVehicles ?? []).map((v: { id: string }) => v.id);
    }
    if (!ids.length) {
      return NextResponse.json({ error: 'Nenhum veículo encontrado' }, { status: 400 });
    }

    // Validate address belongs to user when using collect_point
    if (method === 'collect_point') {
      if (!addressId) {
        return NextResponse.json({ error: 'Endereço de coleta é obrigatório' }, { status: 400 });
      }
      const { data: addr, error: addrErr } = await admin
        .from('addresses')
        .select('id, profile_id, is_collect_point')
        .eq('id', addressId)
        .maybeSingle();
      if (addrErr || !addr || addr.profile_id !== userId || !addr.is_collect_point) {
        return NextResponse.json({ error: 'Endereço inválido' }, { status: 400 });
      }
    }

    // Guard: only allow status changes from allowed current statuses
    const allowedPrevious = new Set([
      'AGUARDANDO DEFINIÇÃO DE COLETA',
      'AGUARDANDO COLETA',
      'AGUARDANDO CHEGADA DO VEÍCULO',
    ]);
    const { data: currentVehicles, error: curErr } = await admin
      .from('vehicles')
      .select('id, status, client_id')
      .in('id', ids)
      .eq('client_id', userId);
    if (curErr) {
      logger.error('load-current-status-error', { error: curErr.message });
      return NextResponse.json({ error: 'Erro ao validar status atual' }, { status: 500 });
    }
    const invalid = (currentVehicles || []).filter((v: { status?: string | null }) =>
      !allowedPrevious.has(String((v?.status || '')).toUpperCase())
    );
    if (invalid.length) {
      return NextResponse.json(
        { error: 'Alteração de coleta não permitida para um ou mais veículos no status atual.' },
        { status: 400 }
      );
    }

    // Build update payload
    const payload: Record<string, unknown> = {};
    if (method === 'collect_point') {
      payload.status = 'AGUARDANDO COLETA';
      payload.pickup_address_id = addressId!;
      payload.estimated_arrival_date = null; // clear any previous client-arrival date
    } else {
      // bring_to_yard
      if (!estimated_arrival_date) {
        return NextResponse.json({ error: 'Data de previsão de chegada é obrigatória' }, { status: 400 });
      }
      payload.status = 'AGUARDANDO CHEGADA DO VEÍCULO';
      payload.estimated_arrival_date = estimated_arrival_date;
      payload.pickup_address_id = null;
    }

    const { error: updErr } = await admin
      .from('vehicles')
      .update(payload)
      .in('id', ids)
      .eq('client_id', userId);

    if (updErr) {
      logger.error('update-vehicles-error', { error: updErr.message });
      return NextResponse.json({ error: 'Erro ao atualizar veículos' }, { status: 500 });
    }

    return NextResponse.json({ success: true, updated: ids.length });
  } catch (e: any) {
    logger.error('unhandled', { error: e?.message });
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

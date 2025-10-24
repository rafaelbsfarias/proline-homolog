import { NextResponse } from 'next/server';
import {
  withSpecialistAuth,
  type AuthenticatedRequest,
} from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const GET = withSpecialistAuth(async (req: AuthenticatedRequest) => {
  try {
    const admin = SupabaseService.getInstance().getAdminClient();
    const specialistId = req.user.id;

    // 1) Buscar clientes associados ao especialista
    const { data: links, error: linkErr } = await admin
      .from('client_specialists')
      .select('client_id')
      .eq('specialist_id', specialistId);
    if (linkErr) throw linkErr;

    const clientIds = (links || []).map(l => l.client_id).filter(Boolean);
    if (clientIds.length === 0) {
      return NextResponse.json({ success: true, items: [] });
    }

    // 2) Buscar solicitações agendadas (retiradas E entregas)
    const { data: requests, error: reqErr } = await admin
      .from('delivery_requests')
      .select(
        'id, vehicle_id, client_id, address_id, desired_date, window_start, window_end, status'
      )
      .in('client_id', clientIds)
      .in('status', ['scheduled']);
    if (reqErr) throw reqErr;

    if (!requests || requests.length === 0) {
      return NextResponse.json({ success: true, items: [] });
    }

    const vehicleIds = requests.map(r => r.vehicle_id);

    // 3) Buscar dados dos veículos
    const { data: vehicles, error: vehErr } = await admin
      .from('vehicles')
      .select('id, plate, brand, model, year, client_id, status')
      .in('id', vehicleIds);
    if (vehErr) throw vehErr;

    // 4) Buscar nomes dos clientes (opcional)
    const { data: profiles } = await admin
      .from('profiles')
      .select('id, full_name')
      .in('id', clientIds);

    const items = requests.map(r => {
      const v = vehicles?.find(x => x.id === r.vehicle_id);
      const clientName = profiles?.find(p => p.id === r.client_id)?.full_name || null;
      const isDelivery = !!r.address_id; // Detectar se é entrega
      return {
        requestId: r.id,
        requestStatus: r.status,
        vehicleId: r.vehicle_id,
        plate: v?.plate || '-',
        brand: v?.brand || '-',
        model: v?.model || '-',
        year: v?.year ? String(v.year) : undefined,
        vehicleStatus: v?.status || null,
        clientId: r.client_id,
        clientName,
        desiredDate: r.desired_date || null,
        windowStart: r.window_start || null,
        windowEnd: r.window_end || null,
        isDelivery, // Adicionar flag para diferenciar
      };
    });

    return NextResponse.json({ success: true, items });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e?.message || 'Erro interno' },
      { status: 500 }
    );
  }
});

import { NextResponse } from 'next/server';
import { SupabaseService } from '@/modules/common/services/SupabaseService';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    const addressId = searchParams.get('addressId');

    if (!clientId) {
      return NextResponse.json({ error: 'clientId é obrigatório' }, { status: 400 });
    }

    const admin = SupabaseService.getInstance().getAdminClient();

    let query = admin
      .from('vehicles')
      .select('id, status, estimated_arrival_date, pickup_address_id, client_id')
      .eq('client_id', clientId);

    if (addressId) {
      query = query.eq('pickup_address_id', addressId);
    }

    const { data: vehicles, error } = await query.order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      clientId,
      addressId,
      vehicles: vehicles || [],
      count: vehicles?.length || 0,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Erro interno',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

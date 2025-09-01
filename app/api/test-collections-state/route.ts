import { NextResponse } from 'next/server';
import { SupabaseService } from '@/modules/common/services/SupabaseService';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');

    if (!clientId) {
      return NextResponse.json({ error: 'clientId é obrigatório' }, { status: 400 });
    }

    const admin = SupabaseService.getInstance().getAdminClient();

    const { data: collections, error } = await admin
      .from('vehicle_collections')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      clientId,
      collections: collections || [],
      count: collections?.length || 0,
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

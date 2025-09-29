import { NextResponse } from 'next/server';
import { withAdminAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { validateUUID } from '@/modules/common/utils/inputSanitization';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const GET = withAdminAuth(async (req: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get('clientId');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '12', 10);
    const plateFilter = searchParams.get('plate') || null;
    const statusFilter = searchParams.getAll('status');
    const dateFilter = searchParams.getAll('dateFilter');
    const today = searchParams.get('today');

    if (!clientId || !validateUUID(clientId)) {
      return NextResponse.json({ success: false, error: 'clientId inválido' }, { status: 400 });
    }

    const supabase = SupabaseService.getInstance().getAdminClient();

    const rpcParams = {
      p_client_id: clientId,
      p_page_size: pageSize,
      p_page_num: page,
      p_plate_filter: plateFilter,
      p_status_filter: statusFilter && statusFilter.length > 0 ? statusFilter : null,
      p_date_filter: dateFilter && dateFilter.length > 0 ? dateFilter : null,
      p_today_date: today,
    };

    const { data, error } = await supabase.rpc('get_client_vehicles_paginated', rpcParams);

    if (error) {
      console.error('Error calling get_client_vehicles_paginated RPC:', error);
      return NextResponse.json(
        { success: false, error: `Erro na RPC: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, ...data });
  } catch (e: unknown) {
    const err = e as Error;
    console.error('GET admin/client-vehicles error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Erro interno do servidor' },
      { status: 500 }
    );
  }
});

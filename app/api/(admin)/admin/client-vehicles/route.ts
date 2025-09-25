import { NextResponse } from 'next/server';
import { withAdminAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { validateUUID } from '@/modules/common/utils/inputSanitization'; // Added for clientId validation

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const GET = withAdminAuth(async (req: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get('clientId');
    const page = parseInt(searchParams.get('page') || '1', 10); // Changed to parseInt with radix
    const pageSize = parseInt(searchParams.get('pageSize') || '12', 10); // Consistent page size
    const plateFilter = searchParams.get('plate') || null;
    const statusFilter = searchParams.getAll('status'); // Changed to getAll for array
    const dateFilter = searchParams.getAll('dateFilter'); // New parameter
    const today = searchParams.get('today'); // New parameter

    if (!clientId || !validateUUID(clientId)) {
      // Added validateUUID
      return NextResponse.json({ success: false, error: 'clientId inválido' }, { status: 400 });
    }

    const supabase = SupabaseService.getInstance().getAdminClient();

    const rpcParams = {
      p_client_id: clientId,
      p_page_num: page,
      p_page_size: pageSize,
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

    // The RPC returns a single JSON object which is in 'data'
    return NextResponse.json({ success: true, ...data });
  } catch (e: unknown) {
    const err = e as Error;
    console.error('GET admin/client-vehicles error:', err); // Added console.error
    return NextResponse.json(
      { success: false, error: err?.message || 'Erro interno do servidor' }, // More specific error message
      { status: 500 }
    );
  }
});

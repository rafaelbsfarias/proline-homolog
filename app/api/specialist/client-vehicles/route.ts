import { NextResponse } from 'next/server';
import {
  withSpecialistAuth,
  type AuthenticatedRequest,
} from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { validateUUID } from '@/modules/common/utils/inputSanitization';
import { checkSpecialistClientLink } from '@/modules/specialist/utils/authorization';

const PAGE_SIZE = 12;

export const GET = withSpecialistAuth(async (req: AuthenticatedRequest) => {
  try {
    const url = new URL(req.url);
    const clientId = url.searchParams.get('clientId');
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const pageSize = parseInt(url.searchParams.get('pageSize') || `${PAGE_SIZE}`, 10);
    const plateFilter = url.searchParams.get('plate') || null;
    const statusFilter = url.searchParams.getAll('status');
    const dateFilter = url.searchParams.getAll('dateFilter');
    const today = url.searchParams.get('today');

    if (!clientId || !validateUUID(clientId)) {
      return NextResponse.json({ error: 'clientId inválido' }, { status: 400 });
    }

    const supabase = SupabaseService.getInstance().getAdminClient();

    // Authorization: ensure this specialist is linked to the client
    const authResult = await checkSpecialistClientLink(supabase, req.user.id, clientId);
    if (!authResult.authorized) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

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
      return NextResponse.json({ error: `Erro na RPC: ${error.message}` }, { status: 500 });
    }

    return NextResponse.json({ success: true, ...data });
  } catch (e) {
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
});

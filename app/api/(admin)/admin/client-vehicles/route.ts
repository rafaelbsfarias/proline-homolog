import { NextResponse } from 'next/server';
import { withAdminAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const GET = withAdminAuth(async (req: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get('clientId');
    const page = Number(searchParams.get('page') || '1');
    const pageSize = Math.min(50, Math.max(1, Number(searchParams.get('pageSize') || '10')));
    const plate = searchParams.get('plate') || '';
    const status = searchParams.get('status') || '';

    if (!clientId) {
      return NextResponse.json(
        { success: false, error: 'clientId é obrigatório' },
        { status: 400 }
      );
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const admin = SupabaseService.getInstance().getAdminClient();

    let base = admin
      .from('vehicles')
      .select('id, plate, brand, model, color, year, status', { count: 'exact' })
      .eq('client_id', clientId);
    if (plate) base = base.ilike('plate', `%${plate}%`);
    if (status) base = base.eq('status', status);

    const { data, error, count } = await base
      .order('created_at', { ascending: false })
      .range(from, to);
    if (error) throw error;

    return NextResponse.json({ success: true, vehicles: data || [], totalCount: count || 0 });
  } catch (e: unknown) {
    const err = e as Error;
    return NextResponse.json(
      { success: false, error: err?.message || 'Erro interno' },
      { status: 500 }
    );
  }
});

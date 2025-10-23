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
    if (!clientId) {
      return NextResponse.json(
        { success: false, error: 'clientId é obrigatório' },
        { status: 400 }
      );
    }

    const admin = SupabaseService.getInstance().getAdminClient();
    const { data, error } = await admin.from('vehicles').select('status').eq('client_id', clientId);
    if (error) throw error;
    const set = new Set<string>();
    (data || []).forEach((r: { status?: string }) => {
      const s = String(r?.status || '')
        .toUpperCase()
        .trim();
      if (s) set.add(s);
    });
    return NextResponse.json({ success: true, statuses: Array.from(set).sort() });
  } catch (e: unknown) {
    const err = e as Error;
    return NextResponse.json(
      { success: false, error: err?.message || 'Erro interno' },
      { status: 500 }
    );
  }
});

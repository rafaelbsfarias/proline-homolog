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
    // Prefer company_name from clients table using profile_id
    const { data, error } = await admin
      .from('clients')
      .select('company_name')
      .eq('profile_id', clientId)
      .maybeSingle();
    if (error) throw error;

    return NextResponse.json({ success: true, company_name: data?.company_name || null });
  } catch (e: unknown) {
    const err = e as Error;
    return NextResponse.json(
      { success: false, error: err?.message || 'Erro interno' },
      { status: 500 }
    );
  }
});

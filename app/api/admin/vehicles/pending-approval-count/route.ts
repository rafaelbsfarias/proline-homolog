import { NextResponse } from 'next/server';
import { withAdminAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { createApiClient } from '@/lib/supabase/api';

async function handler(_req: AuthenticatedRequest) {
  const supabase = createApiClient();

  const TARGET_STATUS = 'AGUARDANDO APROVAÇÃO DO ORÇAMENTO';

  const { count, error } = await supabase
    .from('vehicles')
    .select('id', { count: 'exact', head: true })
    .eq('status', TARGET_STATUS);

  if (error) {
    return NextResponse.json({ count: 0, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ count: count || 0 });
}

export const GET = withAdminAuth(handler);

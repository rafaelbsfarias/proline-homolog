import { NextResponse } from 'next/server';
import { withAdminAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { createApiClient } from '@/lib/supabase/api';

async function handler(_req: AuthenticatedRequest) {
  const supabase = createApiClient();

  const { count, error } = await supabase
    .from('quotes')
    .select('id', { count: 'exact', head: true })
    .in('status', ['pending_admin_approval', 'admin_review']);

  if (error) {
    return NextResponse.json({ count: 0, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ count: count || 0 });
}

export const GET = withAdminAuth(handler);

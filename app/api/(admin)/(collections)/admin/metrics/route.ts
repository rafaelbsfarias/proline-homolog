import { NextResponse } from 'next/server';
import { withAdminAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { MetricsService } from '@/modules/common/services/MetricsService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const GET = withAdminAuth(async (_req: AuthenticatedRequest) => {
  const metrics = MetricsService.getInstance().snapshot();
  return NextResponse.json({ success: true, metrics });
});

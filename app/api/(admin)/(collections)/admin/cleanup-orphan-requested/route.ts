import { NextResponse } from 'next/server';
import { withAdminAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { getLogger } from '@/modules/logger';
import { STATUS } from '@/modules/common/constants/status';
import { logFields } from '@/modules/common/utils/logging';
import { CollectionOrchestrator } from '@collections';

const logger = getLogger('api:admin:cleanup-orphan-requested');

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// POST body: { clientId?: string, dryRun?: boolean, limit?: number }
export const POST = withAdminAuth(async (req: AuthenticatedRequest) => {
  try {
    const body = await req.json().catch(() => ({}));
    const clientId: string | undefined = body?.clientId;
    const dryRun: boolean = body?.dryRun !== false; // default true
    const limit: number | undefined =
      typeof body?.limit === 'number' && body.limit > 0 ? Math.floor(body.limit) : undefined;

    const admin = SupabaseService.getInstance().getAdminClient();
    const result = await CollectionOrchestrator.cleanupOrphanedCollections(admin, {
      clientId,
      limit,
      dryRun,
    });
    return NextResponse.json({ success: true, ...result });
  } catch (e: unknown) {
    const error = e as Error;
    logger.error('unhandled', { error: error?.message });
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
  }
});

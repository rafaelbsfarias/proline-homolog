import { NextResponse } from 'next/server';
import { withAdminAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { CollectionHistoryService } from '@/modules/common/services/CollectionHistoryService';
import { getLogger } from '@/modules/logger';

const logger = getLogger('api:admin:collection-history');

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/admin/collection-history/[clientId]
 * Returns immutable collection history for a client
 */
export const GET = withAdminAuth(
  async (req: AuthenticatedRequest, context: { params: Promise<{ clientId: string }> }) => {
    const params = await context.params;
    const clientId = params.clientId;

    try {
      if (!clientId) {
        return NextResponse.json(
          { success: false, error: 'clientId é obrigatório' },
          { status: 400 }
        );
      }

      const historyService = CollectionHistoryService.getInstance();

      // Get immutable history records
      const historyRecords = await historyService.getClientHistory(clientId);

      // Get detailed history with client and vehicle information
      const detailedHistory = await historyService.getClientHistoryDetailed(clientId);

      // Calculate totals
      const totalCollected = await historyService.getTotalCollected(clientId);

      logger.info('Collection history retrieved', {
        clientId,
        recordCount: historyRecords.length,
        totalCollected,
      });

      return NextResponse.json({
        success: true,
        data: {
          history: historyRecords,
          detailedHistory,
          totalCollected,
          recordCount: historyRecords.length,
        },
      });
    } catch (error: unknown) {
      const err = error as Error;
      logger.error('Failed to retrieve collection history', {
        error: err.message,
        clientId,
      });

      return NextResponse.json(
        { success: false, error: 'Erro interno do servidor' },
        { status: 500 }
      );
    }
  }
);

/**
 * POST /api/admin/collection-history/[clientId]/migrate
 * Manually trigger migration of existing collections to history (admin only)
 */
export const POST = withAdminAuth(
  async (req: AuthenticatedRequest, context: { params: Promise<{ clientId: string }> }) => {
    const params = await context.params;
    const clientId = params.clientId;

    try {
      const { action } = await req.json();

      if (action !== 'migrate') {
        return NextResponse.json({ success: false, error: 'Ação inválida' }, { status: 400 });
      }

      // Migration functionality temporarily disabled
      logger.info('Migration requested but temporarily disabled', { clientId });

      return NextResponse.json({
        success: false,
        message: 'Funcionalidade de migração temporariamente desabilitada',
      });
    } catch (error: unknown) {
      const err = error as Error;
      logger.error('Migration failed', { error: err.message });

      return NextResponse.json({ success: false, error: 'Falha na migração' }, { status: 500 });
    }
  }
);

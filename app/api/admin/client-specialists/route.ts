import { NextResponse } from 'next/server';
import { withAdminAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { GetClientSpecialistsForClient } from '@/modules/vehicles/application/GetClientSpecialistsForClient';
import { getLogger } from '@/modules/logger';

const logger = getLogger('api:admin:client-specialists');

export const GET = withAdminAuth(async (req: AuthenticatedRequest) => {
  try {
    const url = new URL(req.url);
    const clientId = url.searchParams.get('clientId') || '';
    if (!clientId) {
      return NextResponse.json({ error: 'clientId é obrigatório' }, { status: 400 });
    }

    const data = await GetClientSpecialistsForClient(clientId);
    logger.info('success', { clientId: clientId.slice(0, 8), count: data.specialists.length });
    return NextResponse.json({ success: true, ...data });
  } catch (e: any) {
    logger.error('error', e?.message || e);
    return NextResponse.json({ error: 'Erro ao buscar especialistas' }, { status: 500 });
  }
});

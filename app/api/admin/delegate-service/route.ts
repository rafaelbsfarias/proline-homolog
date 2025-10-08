import { NextResponse } from 'next/server';
import { createApiClient } from '@/lib/supabase/api';
import { withAdminAuth } from '@/modules/common/utils/authMiddleware';
//import { getLogger } from '@/modules/logger';

import { type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';

//const logger = getLogger('api:admin:delegate-service');

export const dynamic = 'force-dynamic';

const handler = async (request: AuthenticatedRequest) => {
  const supabase = createApiClient();
  const adminUserId = request.user.id;

  try {
    const payload = await request.json();
    const delegations = Array.isArray(payload) ? payload : [payload];

    for (const delegation of delegations) {
      const { inspection_id, service_category_id, partner_id } = delegation;
      if (!inspection_id || !service_category_id || !partner_id) {
        // logger.warn('Incomplete delegation data received:', delegation);
        return NextResponse.json({ error: 'Dados de delegação incompletos.' }, { status: 400 });
      }
    }

    const dataToInsert = delegations.map(
      ({ inspection_id, service_category_id, partner_id, is_parallel, priority }) => ({
        inspection_id,
        service_category_id,
        partner_id,
        is_parallel: is_parallel ?? false,
        priority: priority ?? 0,
        reviewed_by: adminUserId,
      })
    );

    const { error } = await supabase.from('inspection_delegations').insert(dataToInsert);

    if (error) {
      //logger.error('Error bulk inserting delegations:', error);
      return NextResponse.json(
        { error: 'Erro ao delegar serviço.', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: 'Delegações criadas com sucesso.' });
  } catch (e) {
    //logger.error('[DEBUG] Erro inesperado na delegate-service API:', e);
    return NextResponse.json(
      { error: 'Erro interno do servidor.', details: (e as Error).message },
      { status: 500 }
    );
  }
};

export const POST = withAdminAuth(handler);

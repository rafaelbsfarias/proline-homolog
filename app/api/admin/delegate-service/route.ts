import { NextResponse } from 'next/server';
import { createApiClient } from '@/lib/supabase/api';
import { withAdminAuth } from '@/modules/common/utils/authMiddleware';
import { getLogger } from '@/modules/logger';

const logger = getLogger('api:admin:delegate-service');

export const dynamic = 'force-dynamic';

const handler = async (request: Request) => {
  const supabase = createApiClient();

  try {
    const payload = await request.json();
    const delegations = Array.isArray(payload) ? payload : [payload];

    for (const delegation of delegations) {
      const { inspection_id, service_category_id, partner_id, is_parallel, priority } = delegation;

      if (!inspection_id || !service_category_id || !partner_id) {
        return NextResponse.json({ error: 'Dados de delegação incompletos.' }, { status: 400 });
      }

      const { error } = await supabase.from('inspection_delegations').insert({
        inspection_id,
        service_category_id,
        partner_id,
        is_parallel,
        priority,
        reviewed_by: null,
      });

      if (error) {
        logger.error('Error inserting delegation:', error);
        return NextResponse.json(
          { error: 'Erro ao delegar serviço.', details: error.message },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    logger.error('Unexpected error in delegate-service API:', e);
    return NextResponse.json(
      { error: 'Erro interno do servidor.', details: (e as Error).message },
      { status: 500 }
    );
  }
};

export const POST = withAdminAuth(handler);

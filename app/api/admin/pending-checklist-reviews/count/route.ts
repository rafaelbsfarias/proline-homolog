import { NextResponse } from 'next/server';
import { withAdminAuth } from '@/modules/common/utils/authMiddleware';
import { createApiClient } from '@/lib/supabase/api';

export const dynamic = 'force-dynamic';

const handler = async () => {
  const supabase = createApiClient();

  try {
    const { data, error } = await supabase.rpc('get_pending_checklist_reviews_count');

    if (error) {
      return NextResponse.json(
        { error: 'Erro ao buscar contagem de análises pendentes.', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ count: data });
  } catch (e) {
    return NextResponse.json(
      { error: 'Erro interno do servidor.', details: (e as Error).message },
      { status: 500 }
    );
  }
};

export const GET = withAdminAuth(handler);

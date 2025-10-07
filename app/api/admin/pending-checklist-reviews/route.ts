import { NextResponse } from 'next/server';
import { withAdminAuth } from '@/modules/common/utils/authMiddleware';
import { createApiClient } from '@/lib/supabase/api';

export const dynamic = 'force-dynamic';

const handler = async () => {
  const supabase = createApiClient();

  try {
    const { data, error } = await supabase.rpc('get_pending_checklist_reviews');

    if (error) {
      console.error('Supabase RPC Error:', error); // Add logging for debugging
      return NextResponse.json(
        { error: `Erro ao buscar análises de checklist pendentes: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json(
      { error: 'Erro interno do servidor.', details: (e as Error).message },
      { status: 500 }
    );
  }
};

export const GET = withAdminAuth(handler);

import { NextResponse } from 'next/server';
import { withClientAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { getLogger } from '@/modules/logger';

const logger = getLogger('api:client:my-specialists');

export const revalidate = 0;
export const dynamic = 'force-dynamic';

export const GET = withClientAuth(async (req: AuthenticatedRequest) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      logger.warn('missing-user-id');
      return NextResponse.json({ success: false, error: 'Usuário não autenticado' }, { status: 401 });
    }

    const supabase = SupabaseService.getInstance().getAdminClient();

    // Buscar vínculos do cliente com especialistas
    const { data: links, error: linkErr } = await supabase
      .from('client_specialists')
      .select('specialist_id')
      .eq('client_id', userId);

    if (linkErr) {
      logger.error('links-error', linkErr);
      return NextResponse.json({ success: false, error: 'Erro ao buscar vínculos' }, { status: 500 });
    }

    const ids = (links || []).map((l: any) => l.specialist_id).filter(Boolean);
    if (ids.length === 0) {
      logger.info('no-links', { userId: userId.slice(0, 8) });
      return NextResponse.json({ success: true, specialists: [], names: '' });
    }

    // Buscar perfis dos especialistas
    const { data: profiles, error: profErr } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', ids);

    if (profErr) {
      logger.error('profiles-error', profErr);
      return NextResponse.json({ success: false, error: 'Erro ao buscar especialistas' }, { status: 500 });
    }

    const specialists = (profiles || []).map((p: any) => ({
      id: p.id,
      full_name: p.full_name || null,
      display: p.full_name || '',
    }));
    const names = specialists.map(s => s.display).filter(Boolean).join(', ');

    logger.info('success', { count: specialists.length });
    return NextResponse.json({ success: true, specialists, names });
  } catch (e: any) {
    logger.error('unhandled', e?.message || e);
    return NextResponse.json({ success: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
});

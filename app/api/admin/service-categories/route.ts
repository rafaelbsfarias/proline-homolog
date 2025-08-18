import { NextResponse } from 'next/server';
import { withAdminAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { getLogger } from '@/modules/logger';

const logger = getLogger('AdminServiceCategoriesAPI');

function slugify(input: string): string {
  return input
    .toString()
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40);
}

export const GET = withAdminAuth(async (_req: AuthenticatedRequest) => {
  const supabase = SupabaseService.getInstance().getAdminClient();
  const { data, error } = await supabase
    .from('service_categories')
    .select('id, key, name')
    .order('name', { ascending: true });
  if (error) {
    logger.error('Error fetching service categories:', error);
    return NextResponse.json({ error: 'Erro ao listar categorias' }, { status: 500 });
  }
  return NextResponse.json({ success: true, categories: data || [] });
});

export const POST = withAdminAuth(async (req: AuthenticatedRequest) => {
  try {
    const body = await req.json();
    const nameRaw = (body?.name ?? '').toString().trim();
    if (!nameRaw || nameRaw.length < 2) {
      return NextResponse.json({ error: 'Nome de categoria inválido' }, { status: 400 });
    }
    const key = slugify(nameRaw);
    const supabase = SupabaseService.getInstance().getAdminClient();

    // If exists, return it
    const { data: existing } = await supabase
      .from('service_categories')
      .select('id, key, name')
      .eq('key', key)
      .maybeSingle();
    if (existing) {
      return NextResponse.json({ success: true, category: existing });
    }

    const { data: inserted, error } = await supabase
      .from('service_categories')
      .insert({ key, name: nameRaw })
      .select('id, key, name')
      .single();
    if (error) {
      logger.error('Error creating service category:', error);
      return NextResponse.json({ error: 'Erro ao criar categoria' }, { status: 500 });
    }
    return NextResponse.json({ success: true, category: inserted });
  } catch (e) {
    logger.error('Unhandled error creating category:', e);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
});

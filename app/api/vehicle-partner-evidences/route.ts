import { NextResponse } from 'next/server';
import { withClientAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { getLogger } from '@/modules/logger';
import { BUCKETS, TABLES } from '@/modules/common/constants/database';
import { ITEM_METADATA } from '@/modules/partner/constants/checklistItemsMap';

const logger = getLogger('api:vehicle-partner-evidences');

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const GET = withClientAuth(async (req: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const inspectionId = searchParams.get('inspection_id');
    const vehicleId = searchParams.get('vehicle_id');

    if (!inspectionId || !vehicleId) {
      return NextResponse.json(
        { success: false, error: 'inspection_id e vehicle_id são obrigatórios' },
        { status: 400 }
      );
    }

    // Cliente com token do usuário, respeita RLS
    const authHeader = req.headers.get('authorization') || '';
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data, error } = await supabase
      .from(TABLES.MECHANICS_CHECKLIST_EVIDENCES)
      .select('item_key, storage_path')
      .eq('inspection_id', inspectionId)
      .eq('vehicle_id', vehicleId);

    if (error) {
      logger.error('db_fetch_evidences_error', { error: error.message });
      return NextResponse.json(
        { success: false, error: 'Erro ao carregar evidências' },
        { status: 500 }
      );
    }

    const items = Array.isArray(data) ? data : [];
    // Gerar URLs assinadas
    const results = await Promise.all(
      items.map(async row => {
        const meta = ITEM_METADATA[row.item_key as keyof typeof ITEM_METADATA];
        if (!meta) return null;
        try {
          const { data: signed, error: signedErr } = await supabase.storage
            .from(BUCKETS.VEHICLE_MEDIA)
            .createSignedUrl(row.storage_path, 3600);
          if (signedErr || !signed) {
            logger.warn('signed_url_error', { path: row.storage_path, error: signedErr?.message });
            return null;
          }
          return {
            item_key: row.item_key as string,
            label: meta.label,
            category: meta.category,
            url: signed.signedUrl,
          };
        } catch (e) {
          logger.error('signed_url_exception', { path: row.storage_path, e });
          return null;
        }
      })
    );

    const evidences = results.filter(Boolean) as Array<{
      item_key: string;
      label: string;
      category: string;
      url: string;
    }>;

    return NextResponse.json({ success: true, evidences });
  } catch (e) {
    logger.error('unexpected_error', { e });
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
  }
});

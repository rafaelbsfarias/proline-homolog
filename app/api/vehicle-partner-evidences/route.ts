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

    if (!vehicleId) {
      return NextResponse.json(
        { success: false, error: 'vehicle_id é obrigatório' },
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

    let query = supabase
      .from(TABLES.MECHANICS_CHECKLIST_EVIDENCES)
      .select('item_key, storage_path')
      .eq('vehicle_id', vehicleId);
    if (inspectionId) {
      query = query.eq('inspection_id', inspectionId);
    }
    const { data, error } = await query;

    if (error) {
      logger.error('db_fetch_evidences_error', { error: error.message });
      return NextResponse.json(
        { success: false, error: 'Erro ao carregar evidências' },
        { status: 500 }
      );
    }

    const items = Array.isArray(data) ? data : [];
    // Gerar URLs assinadas para evidências técnicas (itens do checklist)
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

    // Carregar anomalias (evidências livres) e gerar URLs assinadas
    let anomaliesQuery = supabase
      .from('vehicle_anomalies')
      .select('description, photos')
      .eq('vehicle_id', vehicleId)
      .order('created_at', { ascending: true });
    if (inspectionId) {
      anomaliesQuery = anomaliesQuery.eq('inspection_id', inspectionId);
    }
    const { data: anomalies, error: anomaliesError } = await anomaliesQuery;

    if (anomaliesError) {
      logger.warn('anomalies_fetch_error', { error: anomaliesError.message });
    }

    logger.info('anomalies_loaded', {
      inspection_id: (inspectionId || '').substring(0, 8),
      vehicle_id: (vehicleId || '').substring(0, 8),
      count: anomalies?.length || 0,
      has_error: !!anomaliesError,
    });

    const anomalyResults: Array<{
      item_key: string;
      label: string;
      category: string;
      url: string;
    }> = [];
    for (const anomaly of anomalies || []) {
      const desc = anomaly.description || 'Anomalia';
      const photos: string[] = Array.isArray(anomaly.photos) ? anomaly.photos : [];

      logger.debug('processing_anomaly', {
        description: desc.substring(0, 50),
        photos_count: photos.length,
        sample_photo: photos[0]?.substring(0, 100),
      });

      for (const photoPathRaw of photos) {
        try {
          // O path já está no formato correto: "anomalies/{inspection_id}/{vehicle_id}/{filename}"
          // Não precisa fazer parsing adicional
          let path = photoPathRaw || '';

          // Apenas garantir que não comece com barra
          if (path.startsWith('/')) {
            path = path.substring(1);
          }

          logger.debug('creating_signed_url_for_anomaly', {
            original_path: photoPathRaw.substring(0, 100),
            final_path: path.substring(0, 100),
          });

          const { data: signed, error: signErr } = await supabase.storage
            .from(BUCKETS.VEHICLE_MEDIA)
            .createSignedUrl(path, 3600);

          if (signErr || !signed) {
            logger.warn('anomaly_sign_error', {
              path: path.substring(0, 100),
              error: signErr?.message,
            });
            continue;
          }

          logger.debug('signed_url_created_for_anomaly', {
            path: path.substring(0, 50),
            url_length: signed.signedUrl.length,
          });

          anomalyResults.push({
            item_key: `anomaly:${desc}`,
            label: `Anomalia: ${desc}`,
            // Por ora, anomalias são agrupadas em Pintura/Funilaria (parceiros de funilaria/pintura)
            // Se surgirem anomalias de outros parceiros, podemos enriquecer a origem e categoria
            category: 'Pintura/Funilaria',
            url: signed.signedUrl,
          });
        } catch (e) {
          logger.error('anomaly_sign_exception', {
            error: e instanceof Error ? e.message : String(e),
            path: photoPathRaw.substring(0, 100),
          });
        }
      }
    }

    // 3) Incluir mídias legadas salvas em inspection_media por parceiros (para não perder conteúdo antigo)
    try {
      let inspectionIds: string[] = [];
      if (inspectionId) {
        inspectionIds = [inspectionId];
      } else {
        const { data: inspList } = await supabase
          .from('inspections')
          .select('id')
          .eq('vehicle_id', vehicleId);
        inspectionIds = (inspList || []).map((r: any) => r.id);
      }

      if (inspectionIds.length > 0) {
        const { data: partnerMedia } = await supabase
          .from('inspection_media')
          .select('storage_path, uploaded_by, created_at, profiles!inner(role)')
          .in('inspection_id', inspectionIds)
          .eq('profiles.role', 'partner')
          .order('created_at', { ascending: true });

        if (Array.isArray(partnerMedia)) {
          for (const m of partnerMedia) {
            try {
              let path = (m as any).storage_path as string;
              if (!path) continue;
              if (path.includes('vehicle-media/')) {
                const parts = path.split('vehicle-media/');
                path = parts[parts.length - 1];
              }
              if (path.startsWith('/')) path = path.substring(1);

              const { data: signed } = await supabase.storage
                .from(BUCKETS.VEHICLE_MEDIA)
                .createSignedUrl(path, 3600);
              if (!signed) continue;

              const lower = path.toLowerCase();
              let category = 'Mecânica';
              if (lower.includes('/anomalias/')) category = 'Pintura/Funilaria';
              else if (lower.includes('pneu') || lower.includes('tires')) category = 'Pneus';

              anomalyResults.push({
                item_key: `legacy_media:${path}`,
                label: 'Evidência do Parceiro',
                category,
                url: signed.signedUrl,
              });
            } catch {}
          }
        }
      }
    } catch (legacyErr) {
      logger.warn('legacy_partner_media_fetch_warning', { e: String(legacyErr) });
    }

    const evidences = [...results.filter(Boolean), ...anomalyResults] as Array<{
      item_key: string;
      label: string;
      category: string;
      url: string;
    }>;

    logger.info('evidences_returned', {
      inspection_id: (inspectionId || '').substring(0, 8),
      vehicle_id: (vehicleId || '').substring(0, 8),
      checklist_evidences: results.filter(Boolean).length,
      anomaly_evidences: anomalyResults.length,
      total: evidences.length,
    });

    return NextResponse.json({ success: true, evidences });
  } catch (e) {
    logger.error('unexpected_error', { e });
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
  }
});

import { NextResponse } from 'next/server';
import { withAnyAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { createClient } from '@supabase/supabase-js';
import { getLogger } from '@/modules/logger';
import { z } from 'zod';

const logger = getLogger('api:checklist:categories');

const CategoriesSchema = z.object({
  vehicle_id: z.string().uuid('vehicle_id deve ser um UUID válido'),
  inspection_id: z.string().uuid('inspection_id deve ser um UUID válido').optional(),
});

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getCategoriesHandler(req: AuthenticatedRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const vehicle_id = searchParams.get('vehicle_id') || undefined;
    const inspection_id = searchParams.get('inspection_id') || undefined;

    logger.info('categories_request', {
      vehicle_id,
      inspection_id,
      user_id: req.user.id,
      user_role: req.user.role,
    });

    const validation = CategoriesSchema.safeParse({
      vehicle_id,
      inspection_id,
    });

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Parâmetros inválidos',
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }

    const { vehicle_id: validVehicleId, inspection_id: validInspectionId } = validation.data;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Buscar ANOMALIAS de forma resiliente (sem depender de joins por nome de FK)
    const anomaliesResult = await supabase
      .from('vehicle_anomalies')
      .select(
        `
        id,
        vehicle_id,
        inspection_id,
        quote_id,
        partner_id,
        description,
        created_at
      `
      )
      .eq('vehicle_id', validVehicleId);

    // Buscar CHECKLISTS estruturados de forma resiliente
    const checklistsResult = await supabase
      .from('mechanics_checklist')
      .select(
        `
        id,
        vehicle_id,
        inspection_id,
        quote_id,
        partner_id,
        status,
        created_at
      `
      )
      .eq('vehicle_id', validVehicleId)
      .eq('status', 'submitted');

    if (anomaliesResult.error) {
      logger.error('fetch_anomalies_error', {
        error: anomaliesResult.error.message,
        code: anomaliesResult.error.code,
      });
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar anomalias' },
        { status: 500 }
      );
    }

    if (checklistsResult.error) {
      logger.error('fetch_checklists_error', {
        error: checklistsResult.error.message,
        code: checklistsResult.error.code,
      });
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar checklists' },
        { status: 500 }
      );
    }

    logger.info('entries_fetched', {
      anomalies_count: anomaliesResult.data?.length || 0,
      checklists_count: checklistsResult.data?.length || 0,
      vehicle_id: validVehicleId,
    });

    // Enriquecer anomalias com profile.full_name e partners.category
    const entries: Array<{
      id: string;
      category: string;
      partner_id: string;
      partner_name: string;
      type: 'mechanics_checklist' | 'vehicle_anomalies';
      has_anomalies: boolean;
      created_at: string;
      status: string;
    }> = [];
    const anomalyRows = anomaliesResult.data || [];
    const anomalyPartnerIds = Array.from(
      new Set((anomalyRows as Array<{ partner_id: string }>).map(a => a.partner_id).filter(Boolean))
    );

    const profilesById: Record<string, { id: string; full_name: string | null }> = {};
    const partnersByProfileId: Record<string, { profile_id: string; category: string | null }> = {};

    if (anomalyPartnerIds.length > 0) {
      const [{ data: profiles }, { data: partnersData }] = await Promise.all([
        supabase.from('profiles').select('id, full_name').in('id', anomalyPartnerIds),
        supabase
          .from('partners')
          .select('profile_id, category')
          .in('profile_id', anomalyPartnerIds),
      ]);

      (profiles || []).forEach(p => {
        profilesById[p.id] = { id: p.id, full_name: p.full_name ?? null };
      });
      (partnersData || []).forEach(p => {
        partnersByProfileId[p.profile_id] = {
          profile_id: p.profile_id,
          category: p.category ?? null,
        };
      });
    }

    for (const anomaly of anomalyRows) {
      const profile = profilesById[anomaly.partner_id];
      const partnerMeta = partnersByProfileId[anomaly.partner_id];
      if (!anomaly.partner_id || !profile) continue;

      const categoryName = partnerMeta?.category || 'Anomalias';

      entries.push({
        id: anomaly.id,
        category: categoryName,
        partner_id: anomaly.partner_id,
        partner_name: profile.full_name || 'Parceiro',
        type: 'vehicle_anomalies',
        has_anomalies: true,
        created_at: anomaly.created_at,
        status: 'submitted',
      });
    }

    // Enriquecer checklists com profile.full_name e partners.category
    const checklistRows = checklistsResult.data || [];
    const checklistPartnerIds = Array.from(
      new Set(
        (checklistRows as Array<{ partner_id: string }>).map(c => c.partner_id).filter(Boolean)
      )
    );

    if (checklistPartnerIds.length > 0) {
      const [{ data: checklistProfiles }, { data: checklistPartnersData }] = await Promise.all([
        supabase.from('profiles').select('id, full_name').in('id', checklistPartnerIds),
        supabase
          .from('partners')
          .select('profile_id, category')
          .in('profile_id', checklistPartnerIds),
      ]);

      (checklistProfiles || []).forEach(p => {
        profilesById[p.id] = { id: p.id, full_name: p.full_name ?? null };
      });
      (checklistPartnersData || []).forEach(p => {
        partnersByProfileId[p.profile_id] = {
          profile_id: p.profile_id,
          category: p.category ?? null,
        };
      });
    }

    // Processar checklists estruturados
    for (const checklist of checklistRows) {
      const profile = profilesById[checklist.partner_id];
      const partnerMeta = partnersByProfileId[checklist.partner_id];
      if (!checklist.partner_id || !profile) continue;

      // Usar categoria real do parceiro
      const categoryName = partnerMeta?.category || 'Mecânica';

      entries.push({
        id: checklist.id,
        category: categoryName,
        partner_id: checklist.partner_id,
        partner_name: profile.full_name || 'Parceiro',
        type: 'mechanics_checklist',
        has_anomalies: false, // Checklists estruturados não têm anomalias separadas
        created_at: checklist.created_at,
        status: checklist.status,
      });
    }

    logger.info('entries_processed', {
      vehicle_id: validVehicleId,
      entries_count: entries.length,
    });

    return NextResponse.json({
      success: true,
      categories: entries, // Mantém o nome 'categories' para compatibilidade
    });
  } catch (e) {
    const error = e as Error;
    logger.error('get_categories_unexpected_error', {
      error: error.message || String(e),
    });
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export const GET = withAnyAuth(getCategoriesHandler);

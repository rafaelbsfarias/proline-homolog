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

    // Buscar parceiros e categorias a partir de quotes + service_orders
    // e checar se cada parceiro possui anomalias no contexto (inspection opcional)
    const { data: quotes, error: quotesError } = await supabase
      .from('quotes')
      .select(
        `
        id,
        partner_id,
        partners ( id, name ),
        service_orders!inner (
          vehicle_id,
          service_categories!inner ( name )
        )
      `
      )
      .eq('service_orders.vehicle_id', validVehicleId);

    if (quotesError) {
      logger.error('fetch_quotes_error', { error: quotesError.message });
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar parceiros' },
        { status: 500 }
      );
    }

    type QuoteRow = {
      partner_id: string;
      partners: { id: string; name: string } | { id: string; name: string }[] | null;
      service_orders:
        | {
            service_categories: { name: string } | { name: string }[] | null;
          }
        | { service_categories: { name: string } | { name: string }[] | null }[]
        | null;
    };

    const partnerCategoryPairs: { partner_id: string; partner_name: string; category: string }[] =
      [];
    for (const q of (quotes as QuoteRow[]) || []) {
      const partner = Array.isArray(q.partners) ? q.partners[0] : q.partners;
      const so = Array.isArray(q.service_orders) ? q.service_orders[0] : q.service_orders;
      const cat = so?.service_categories;
      const categoryName = Array.isArray(cat) ? cat[0]?.name : cat?.name;
      if (q.partner_id && partner && categoryName) {
        partnerCategoryPairs.push({
          partner_id: q.partner_id,
          partner_name: partner.name || 'Parceiro',
          category: categoryName,
        });
      }
    }

    // Remover duplicados (mesmo parceiro+categoria)
    const seen = new Set<string>();
    const uniquePairs = partnerCategoryPairs.filter(p => {
      const key = `${p.partner_id}-${p.category}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Para cada par, checar se existem anomalias do parceiro (define has_anomalies)
    const categories: {
      category: string;
      partner_id: string;
      partner_name: string;
      has_anomalies: boolean;
    }[] = [];
    for (const p of uniquePairs) {
      const anomaliesQuery = supabase
        .from('vehicle_anomalies')
        .select('id', { count: 'exact', head: true })
        .eq('vehicle_id', validVehicleId)
        .eq('partner_id', p.partner_id);
      // Não filtrar por inspection_id para abarcar anomalias vinculadas por quote_id
      const { count } = await anomaliesQuery;
      categories.push({
        category: p.category,
        partner_id: p.partner_id,
        partner_name: p.partner_name,
        has_anomalies: (count || 0) > 0,
      });
    }

    // Complementar: incluir parceiros com anomalias sem quote/service_order
    const anomaliesPartnersQuery = supabase
      .from('vehicle_anomalies')
      .select(
        `
        partner_id,
        profiles!vehicle_anomalies_partner_id_fkey ( id, full_name )
      `
      )
      .eq('vehicle_id', validVehicleId);
    // Não filtrar por inspection_id aqui; alguns registros usam apenas quote_id
    const { data: anomalyRows, error: anomalyPartnersError } = await anomaliesPartnersQuery;
    if (anomalyPartnersError) {
      logger.warn('anomaly_partners_fetch_error', { error: anomalyPartnersError.message });
    } else {
      const existingKeys = new Set(categories.map(c => `${c.partner_id}-${c.category}`));
      const partnerIds = Array.from(
        new Set((anomalyRows || []).map((r: any) => r.partner_id).filter(Boolean))
      ) as string[];

      if (partnerIds.length > 0) {
        const { data: partnersRows } = await supabase
          .from('partners')
          .select('id, name, partner_type')
          .in('id', partnerIds);

        const typeToCategory = (t?: string) => {
          switch (t) {
            case 'mechanic':
              return 'Mecânica';
            case 'bodyshop':
              return 'Funilaria/Pintura';
            case 'tire_shop':
              return 'Pneus';
            case 'car_wash':
              return 'Lavagem';
            case 'store':
              return 'Loja';
            case 'yard_wholesale':
              return 'Pátio Atacado';
            default:
              return 'Checklist do Parceiro';
          }
        };

        const partnerMeta = new Map<string, { name?: string; type?: string }>();
        (partnersRows || []).forEach((p: any) =>
          partnerMeta.set(p.id, { name: p.name, type: p.partner_type })
        );

        // Nome do perfil (fallback)
        const profileName = new Map<string, string>();
        (anomalyRows || []).forEach((r: any) => {
          const prof = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles;
          if (r.partner_id && prof?.full_name) profileName.set(r.partner_id, prof.full_name);
        });

        // Criar entradas faltantes
        for (const pid of partnerIds) {
          const meta = partnerMeta.get(pid);
          const categoryName = typeToCategory(meta?.type);
          const key = `${pid}-${categoryName}`;
          if (existingKeys.has(key)) continue;

          // Contar anomalias deste parceiro
          const cntQuery = supabase
            .from('vehicle_anomalies')
            .select('id', { count: 'exact', head: true })
            .eq('vehicle_id', validVehicleId)
            .eq('partner_id', pid);
          // Não filtrar por inspection_id aqui; alguns registros usam apenas quote_id
          const { count: pCount } = await cntQuery;

          categories.push({
            category: categoryName,
            partner_id: pid,
            partner_name: meta?.name || profileName.get(pid) || 'Parceiro',
            has_anomalies: (pCount || 0) > 0,
          });
        }
      }
    }

    logger.info('categories_fetched', {
      vehicle_id: validVehicleId,
      categories_count: categories.length,
    });

    return NextResponse.json({
      success: true,
      categories,
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

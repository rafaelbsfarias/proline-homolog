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

    // Buscar anomalias agrupadas por parceiro e suas categorias
    let query = supabase
      .from('vehicle_anomalies')
      .select(
        `
        id,
        partner_id,
        profiles!vehicle_anomalies_partner_id_fkey (
          id,
          full_name
        )
      `
      )
      .eq('vehicle_id', validVehicleId);

    if (validInspectionId) {
      query = query.eq('inspection_id', validInspectionId);
    }

    const { data: anomalies, error } = await query;

    if (error) {
      logger.error('fetch_anomalies_error', {
        error: error.message,
        code: error.code,
        details: error.details,
      });
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar anomalias' },
        { status: 500 }
      );
    }

    logger.info('anomalies_fetched', {
      anomalies_count: anomalies?.length || 0,
      vehicle_id: validVehicleId,
    });

    // Agrupar por parceiro e categoria
    const categoriesMap = new Map<
      string,
      {
        category: string;
        partner_id: string;
        partner_name: string;
        has_anomalies: boolean;
      }
    >();

    // Para cada anomalia, buscar a categoria do parceiro através do quote/service_order
    for (const anomaly of anomalies || []) {
      const profile = anomaly.profiles;
      const profileData = Array.isArray(profile) ? profile[0] : profile;

      if (!profileData || !anomaly.partner_id) continue;

      // Buscar a categoria do parceiro através do quote e service_order
      const { data: quoteData } = await supabase
        .from('quotes')
        .select(
          `
          id,
          service_orders!inner (
            id,
            category_id,
            service_categories!inner (
              name
            )
          )
        `
        )
        .eq('partner_id', anomaly.partner_id)
        .eq('service_orders.vehicle_id', validVehicleId)
        .limit(1)
        .single();

      if (quoteData && quoteData.service_orders) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const serviceOrder: any = quoteData.service_orders;
        const categoryName =
          serviceOrder.service_categories?.name || serviceOrder.service_categories?.[0]?.name;

        if (categoryName) {
          const key = `${anomaly.partner_id}-${categoryName}`;
          if (!categoriesMap.has(key)) {
            categoriesMap.set(key, {
              category: categoryName,
              partner_id: anomaly.partner_id,
              partner_name: profileData.full_name || 'Parceiro',
              has_anomalies: true,
            });
          }
        }
      }
    }

    const categories = Array.from(categoriesMap.values());

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

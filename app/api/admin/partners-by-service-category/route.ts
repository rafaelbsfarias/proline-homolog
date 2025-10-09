import { NextResponse } from 'next/server';
import { createApiClient } from '@/lib/supabase/api';
import { withAdminAuth } from '@/modules/common/utils/authMiddleware';
import { getLogger } from '@/modules/logger';

const logger = getLogger('api:admin:partners-by-service-category');

export const dynamic = 'force-dynamic';

const handler = async (request: Request) => {
  const supabase = createApiClient();
  const { searchParams } = new URL(request.url);
  const categoryKey = searchParams.get('category');

  if (!categoryKey) {
    return NextResponse.json({ error: "Parâmetro 'category' é obrigatório." }, { status: 400 });
  }

  try {
    // 1️⃣ Pega a categoria pelo key
    const { data: serviceCategoryData, error: serviceCategoryError } = await supabase
      .from('service_categories')
      .select('id, name')
      .eq('key', categoryKey)
      .single();

    if (serviceCategoryError || !serviceCategoryData) {
      logger.error(`Service category not found for key: ${categoryKey}`, serviceCategoryError);
      return NextResponse.json(
        { error: `Categoria de serviço '${categoryKey}' não encontrada.` },
        { status: 404 }
      );
    }

    // 2️⃣ Pega os IDs dos parceiros ligados a essa categoria
    const { data: partnerServicesData, error: partnerServicesError } = await supabase
      .from('partners_service_categories')
      .select('partner_id')
      .eq('category_id', serviceCategoryData.id);

    if (partnerServicesError) {
      logger.error(
        `Error fetching partner services for category: ${categoryKey}`,
        partnerServicesError
      );
      return NextResponse.json(
        { error: 'Erro ao buscar parceiros.', details: partnerServicesError.message },
        { status: 500 }
      );
    }

    const partnerIds = partnerServicesData.map(p => p.partner_id);

    if (partnerIds.length === 0) {
      return NextResponse.json([], { status: 200 }); // Nenhum parceiro encontrado
    }

    // 3️⃣ Pega os dados dos parceiros
    const { data: partnersData, error: partnersError } = await supabase
      .from('partners')
      .select('id:profile_id, company_name')
      .in('profile_id', partnerIds);

    if (partnersError) {
      logger.error(`Error fetching partners info for category: ${categoryKey}`, partnersError);
      return NextResponse.json(
        { error: 'Erro ao buscar parceiros.', details: partnersError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(partnersData);
  } catch (e) {
    logger.error('Unexpected error in partners-by-service-category API:', e);
    return NextResponse.json(
      { error: 'Erro interno do servidor.', details: (e as Error).message },
      { status: 500 }
    );
  }
};

export const GET = withAdminAuth(handler);

'use server';

import { NextResponse } from 'next/server';
import { createApiClient } from '@/lib/supabase/api';
import { getLogger } from '@/modules/logger';
import { withPartnerAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';

const logger = getLogger('api:partner:budgets:get');

interface BudgetResponse {
  id: string;
  name: string;
  vehiclePlate: string;
  vehicleModel: string | null;
  vehicleBrand: string | null;
  vehicleYear: number | null;
  totalValue: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  items: BudgetItemResponse[];
}

interface BudgetItemResponse {
  id: string;
  serviceId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface BudgetItem {
  serviceId?: string; // optional: may come from existing service
  description: string; // required: used to create service when no serviceId
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface UpdateBudgetRequest {
  name: string;
  vehiclePlate: string;
  vehicleModel: string;
  vehicleBrand: string;
  vehicleYear?: number;
  items: BudgetItem[];
  totalValue: number;
}

async function getBudgetHandler(
  req: AuthenticatedRequest,
  context: { params: Promise<{ budgetId: string }> }
): Promise<NextResponse> {
  try {
    const { budgetId } = await context.params;

    if (!budgetId) {
      logger.error('ID do orçamento não fornecido');
      return NextResponse.json({ error: 'ID do orçamento é obrigatório' }, { status: 400 });
    }

    const partnerId = req.user.id;

    logger.info('🔍 Iniciando busca de orçamento (quote)', {
      budgetId,
      partnerId,
      userEmail: req.user.email,
      userRole: req.user.role,
    });

    // Configurar cliente Supabase com service role para APIs
    logger.info('🔧 Configurando cliente Supabase com service role');
    const supabase = createApiClient();

    // Buscar o quote com dados do veículo (versão que funcionou no teste)
    logger.info('📡 Executando consulta complexa no Supabase', {
      table: 'quotes',
      budgetId,
      partnerId,
    });

    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .select(
        `
        id,
        total_value,
        status,
        created_at,
        updated_at,
        supplier_delivery_date,
        service_order_id,
        service_orders (
          id,
          order_code,
          vehicle_id,
          vehicles (
            id,
            plate,
            brand,
            model,
            year,
            color
          )
        )
      `
      )
      .eq('id', budgetId)
      .eq('partner_id', partnerId)
      .single();

    if (quoteError) {
      logger.error('❌ Erro na consulta do quote', {
        quoteError,
        budgetId,
        partnerId,
        errorCode: quoteError.code,
        errorMessage: quoteError.message,
        errorDetails: quoteError.details,
        errorHint: quoteError.hint,
      });

      if (quoteError.code === 'PGRST116') {
        logger.warn('⚠️ Quote não encontrado para este partner', { budgetId, partnerId });
        return NextResponse.json({ error: 'Orçamento não encontrado' }, { status: 404 });
      }
      logger.error('💥 Erro inesperado ao buscar quote', {
        error: quoteError,
        budgetId,
        partnerId,
      });
      return NextResponse.json({ error: 'Erro ao buscar orçamento' }, { status: 500 });
    }

    logger.info('✅ Quote encontrado, dados brutos:', {
      quoteId: quote.id,
      hasServiceOrders: !!quote.service_orders,
      serviceOrdersType: typeof quote.service_orders,
      serviceOrdersKeys: quote.service_orders ? Object.keys(quote.service_orders) : null,
    });

    // Extrair dados do veículo usando tipagem explícita
    const serviceOrder = quote.service_orders as unknown as {
      id: string;
      order_code: string;
      vehicle_id: string;
      vehicles: {
        id: string;
        plate: string;
        brand: string;
        model: string;
        year: number;
        color: string;
      };
    };
    const vehicle = serviceOrder?.vehicles;

    logger.info('📋 Dados extraídos:', {
      serviceOrderId: serviceOrder?.id,
      vehicleId: vehicle?.id,
      vehiclePlate: vehicle?.plate,
      vehicleBrand: vehicle?.brand,
      vehicleModel: vehicle?.model,
      vehicleYear: vehicle?.year,
    });

    // Buscar itens do orçamento na tabela quote_items
    logger.info('🔍 Buscando itens do orçamento...');
    const { data: quoteItems, error: itemsError } = await supabase
      .from('quote_items')
      .select(
        `
        id,
        service_id,
        quantity,
        unit_price,
        total_price,
        notes,
        created_at
      `
      )
      .eq('quote_id', budgetId)
      .order('created_at', { ascending: true });

    if (itemsError) {
      logger.error('❌ Erro ao buscar itens do quote', {
        itemsError,
        budgetId,
      });
      // Não falha a requisição, apenas retorna lista vazia
    }

    // Formatar itens do orçamento
    const budgetItems: BudgetItemResponse[] = (quoteItems || []).map(
      (item: {
        id: string;
        service_id: string;
        quantity: number;
        unit_price: number;
        total_price: number;
        notes: string | null;
      }) => ({
        id: item.id,
        serviceId: item.service_id,
        description: item.notes || `Serviço ${item.service_id.slice(0, 8)}`,
        quantity: item.quantity,
        unitPrice: parseFloat(item.unit_price.toString()),
        totalPrice: parseFloat(item.total_price.toString()),
      })
    );

    logger.info('📋 Itens do orçamento processados', {
      itemCount: budgetItems.length,
    });

    // Formatar resposta
    const response: BudgetResponse = {
      id: quote.id,
      name: `Orçamento ${serviceOrder?.order_code || quote.id.slice(0, 8)}`,
      vehiclePlate: vehicle?.plate || '',
      vehicleModel: vehicle?.model || null,
      vehicleBrand: vehicle?.brand || null,
      vehicleYear: vehicle?.year || null,
      totalValue: quote.total_value ? parseFloat(quote.total_value.toString()) : 0,
      status: quote.status || 'draft',
      createdAt: quote.created_at,
      updatedAt: quote.updated_at,
      items: budgetItems,
    };

    logger.info('✅ Quote processado com sucesso', {
      budgetId,
      partnerId,
      itemCount: budgetItems.length,
      vehicleData: {
        plate: vehicle?.plate,
        brand: vehicle?.brand,
        model: vehicle?.model,
        year: vehicle?.year,
      },
      totalValue: response.totalValue,
      status: response.status,
    });

    return NextResponse.json(response);
  } catch (error) {
    logger.error('💥 Erro interno ao buscar orçamento', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

async function updateBudgetHandler(
  req: AuthenticatedRequest,
  context: { params: Promise<{ budgetId: string }> }
): Promise<NextResponse> {
  try {
    const { budgetId } = await context.params;

    if (!budgetId) {
      return NextResponse.json({ error: 'ID do orçamento é obrigatório' }, { status: 400 });
    }

    const body: UpdateBudgetRequest = await req.json();
    const partnerId = req.user.id;

    logger.info('Atualizando orçamento', {
      budgetId,
      partnerId,
      budgetName: body.name,
      itemCount: body.items.length,
      totalValue: body.totalValue,
    });

    if (!body.items || body.items.length === 0) {
      return NextResponse.json(
        { error: 'O orçamento deve conter pelo menos um serviço' },
        { status: 400 }
      );
    }

    const supabase = createApiClient();

    // Verificar se o orçamento existe e pertence ao partner
    const { data: existingBudget, error: checkError } = await supabase
      .from('quotes')
      .select('id, status')
      .eq('id', budgetId)
      .eq('partner_id', partnerId)
      .single();

    if (checkError || !existingBudget) {
      logger.warn('Orçamento não encontrado ou não pertence ao partner', { budgetId, partnerId });
      return NextResponse.json({ error: 'Orçamento não encontrado' }, { status: 404 });
    }

    // Atualizar o orçamento
    // quotes table does not have name/vehicle_* columns; only update totals and timestamp
    const updateData = {
      total_value: body.totalValue,
      updated_at: new Date().toISOString(),
    };

    const { error: updateError } = await supabase
      .from('quotes')
      .update(updateData)
      .eq('id', budgetId)
      .eq('partner_id', partnerId);

    if (updateError) {
      logger.error('Erro ao atualizar orçamento', { error: updateError, budgetId });
      return NextResponse.json({ error: 'Erro ao atualizar orçamento' }, { status: 500 });
    }

    // Remover itens existentes
    const { error: deleteItemsError } = await supabase
      .from('quote_items')
      .delete()
      .eq('quote_id', budgetId);

    if (deleteItemsError) {
      logger.error('Erro ao remover itens existentes', { error: deleteItemsError, budgetId });
      return NextResponse.json({ error: 'Erro ao atualizar itens do orçamento' }, { status: 500 });
    }

    // Também remover serviços existentes do orçamento (vamos recriar de acordo com o payload)
    const { error: deleteServicesError } = await supabase
      .from('services')
      .delete()
      .eq('quote_id', budgetId);

    if (deleteServicesError) {
      logger.error('Erro ao remover serviços existentes', { error: deleteServicesError, budgetId });
      return NextResponse.json(
        { error: 'Erro ao atualizar serviços do orçamento' },
        { status: 500 }
      );
    }

    // Recriar services e quote_items
    let createdCount = 0;
    for (const item of body.items) {
      // Se não houver serviceId, criaremos um novo serviço
      let serviceId = item.serviceId;

      if (!serviceId) {
        const serviceInsert = {
          quote_id: budgetId,
          description: item.description,
          value: item.unitPrice,
          status: 'pending',
          estimated_days: 1,
          parts_needed: false,
        } as const;

        const { data: createdService, error: serviceError } = await supabase
          .from('services')
          .insert(serviceInsert)
          .select()
          .single();

        if (serviceError || !createdService) {
          logger.error('Erro ao criar service', { error: serviceError, item });
          return NextResponse.json(
            { error: 'Erro ao criar serviço do orçamento' },
            { status: 500 }
          );
        }
        serviceId = createdService.id as string;
      }

      const quoteItemInsert = {
        quote_id: budgetId,
        service_id: serviceId,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total_price: item.totalPrice,
        notes: item.description || null,
        created_at: new Date().toISOString(),
      };

      const { error: quoteItemError } = await supabase.from('quote_items').insert(quoteItemInsert);

      if (quoteItemError) {
        logger.error('Erro ao inserir quote_item', { error: quoteItemError, budgetId, item });
        return NextResponse.json({ error: 'Erro ao salvar itens do orçamento' }, { status: 500 });
      }
      createdCount += 1;
    }

    logger.info('Orçamento atualizado com sucesso', {
      budgetId,
      partnerId,
      itemCount: createdCount,
    });

    return NextResponse.json({
      success: true,
      message: 'Orçamento atualizado com sucesso!',
      budget: {
        id: budgetId,
        name: body.name,
        totalValue: body.totalValue,
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('Erro interno ao atualizar orçamento', { error });
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export const GET = withPartnerAuth(
  async (req: AuthenticatedRequest, context: { params: Promise<{ budgetId: string }> }) =>
    getBudgetHandler(req, context)
);
export const PUT = withPartnerAuth(
  async (req: AuthenticatedRequest, context: { params: Promise<{ budgetId: string }> }) =>
    updateBudgetHandler(req, context)
);

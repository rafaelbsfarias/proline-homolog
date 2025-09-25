'use server';

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getLogger } from '@/modules/logger';
import { withPartnerAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';

const logger = getLogger('api:partner:budgets');

interface BudgetItem {
  serviceId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface SaveBudgetRequest {
  name: string;
  vehiclePlate: string;
  vehicleModel: string;
  vehicleBrand: string;
  vehicleYear?: number;
  items: BudgetItem[];
  totalValue: number;
  serviceRequestId?: string; // Para associar a uma solicitação de serviço existente
}

async function saveBudgetHandler(req: AuthenticatedRequest): Promise<NextResponse> {
  try {
    const body: SaveBudgetRequest = await req.json();
    const partnerId = req.user.id;

    logger.info('Salvando orçamento', {
      partnerId,
      budgetName: body.name,
      vehiclePlate: body.vehiclePlate,
      itemCount: body.items.length,
      totalValue: body.totalValue,
    });

    // Validar dados obrigatórios
    if (!body.name?.trim()) {
      return NextResponse.json({ error: 'Nome do orçamento é obrigatório' }, { status: 400 });
    }

    if (!body.vehiclePlate?.trim()) {
      return NextResponse.json({ error: 'Placa do veículo é obrigatória' }, { status: 400 });
    }

    if (!body.items || body.items.length === 0) {
      return NextResponse.json(
        { error: 'O orçamento deve conter pelo menos um serviço' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Verificar se o partner existe
    const { data: partner, error: partnerError } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('id', partnerId)
      .eq('role', 'partner')
      .single();

    if (partnerError || !partner) {
      logger.error('Partner não encontrado', { partnerId, error: partnerError });
      return NextResponse.json({ error: 'Partner não encontrado' }, { status: 404 });
    }

    // Criar o orçamento
    const budgetData = {
      partner_id: partnerId,
      name: body.name.trim(),
      vehicle_plate: body.vehiclePlate.trim(),
      vehicle_model: body.vehicleModel?.trim() || null,
      vehicle_brand: body.vehicleBrand?.trim() || null,
      vehicle_year: body.vehicleYear || null,
      total_value: body.totalValue,
      service_request_id: body.serviceRequestId || null,
      status: 'draft', // orçamento em rascunho
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: budget, error: budgetError } = await supabase
      .from('quotes')
      .insert(budgetData)
      .select()
      .single();

    if (budgetError) {
      logger.error('Erro ao salvar orçamento', { error: budgetError, budgetData });
      return NextResponse.json({ error: 'Erro ao salvar orçamento' }, { status: 500 });
    }

    // Salvar os itens do orçamento
    const budgetItems = body.items.map(item => ({
      quote_id: budget.id,
      service_id: item.serviceId,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      total_price: item.totalPrice,
      created_at: new Date().toISOString(),
    }));

    const { error: itemsError } = await supabase.from('quote_items').insert(budgetItems);

    if (itemsError) {
      logger.error('Erro ao salvar itens do orçamento', { error: itemsError, budgetId: budget.id });

      // Tentar remover o orçamento se os itens falharam
      await supabase.from('quotes').delete().eq('id', budget.id);

      return NextResponse.json({ error: 'Erro ao salvar itens do orçamento' }, { status: 500 });
    }

    logger.info('Orçamento salvo com sucesso', {
      budgetId: budget.id,
      partnerId,
      itemCount: budgetItems.length,
    });

    return NextResponse.json({
      success: true,
      message: 'Orçamento salvo com sucesso!',
      budget: {
        id: budget.id,
        name: budget.name,
        totalValue: budget.total_value,
        status: budget.status,
        createdAt: budget.created_at,
      },
    });
  } catch (error) {
    logger.error('Erro interno ao salvar orçamento', { error });
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export const POST = withPartnerAuth(saveBudgetHandler);

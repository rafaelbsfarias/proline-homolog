'use server';

import { NextResponse } from 'next/server';
import { getLogger } from '@/modules/logger';
import { withPartnerAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { z } from 'zod';

const logger = getLogger('api:partner:budgets');

// Schema de validação
const BudgetItemSchema = z.object({
  serviceId: z.string().uuid('ID do serviço inválido'),
  description: z.string().min(1, 'Descrição é obrigatória'),
  quantity: z.number().positive('Quantidade deve ser positiva'),
  unitPrice: z.number().nonnegative('Preço unitário deve ser não-negativo'),
  totalPrice: z.number().nonnegative('Preço total deve ser não-negativo'),
  estimatedDays: z.number().positive('Dias estimados devem ser positivos').optional(),
});

const SaveBudgetSchema = z.object({
  name: z.string().min(1, 'Nome do orçamento é obrigatório'),
  vehiclePlate: z.string().min(1, 'Placa do veículo é obrigatória'),
  vehicleModel: z.string().optional(),
  vehicleBrand: z.string().optional(),
  vehicleYear: z.number().optional(),
  items: z.array(BudgetItemSchema).min(1, 'O orçamento deve conter pelo menos um serviço'),
  totalValue: z.number().nonnegative('Valor total deve ser não-negativo'),
  serviceRequestId: z.string().uuid().optional(),
});

async function saveBudgetHandler(req: AuthenticatedRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const partnerId = req.user.id;

    // Validar entrada
    const validation = SaveBudgetSchema.safeParse(body);
    if (!validation.success) {
      logger.warn('validation_error', { errors: validation.error.errors });
      return NextResponse.json(
        { error: 'Dados inválidos', details: validation.error.errors },
        { status: 400 }
      );
    }

    const data = validation.data;

    logger.info('Salvando orçamento', {
      partnerId,
      budgetName: data.name,
      vehiclePlate: data.vehiclePlate,
      itemCount: data.items.length,
      totalValue: data.totalValue,
    });

    const supabase = SupabaseService.getInstance().getAdminClient();

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
      name: data.name.trim(),
      vehicle_plate: data.vehiclePlate.trim(),
      vehicle_model: data.vehicleModel?.trim() || null,
      vehicle_brand: data.vehicleBrand?.trim() || null,
      vehicle_year: data.vehicleYear || null,
      total_value: data.totalValue,
      service_request_id: data.serviceRequestId || null,
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
    const budgetItems = data.items.map(item => ({
      quote_id: budget.id,
      service_id: item.serviceId,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      total_price: item.totalPrice,
      estimated_days: item.estimatedDays || null,
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

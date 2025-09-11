import { NextResponse } from 'next/server';
import { withPartnerAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { handleApiError } from '@/lib/utils/apiErrorHandlers';
import { DatabaseError, ValidationError } from '@/lib/utils/errors';

async function createServiceHandler(req: AuthenticatedRequest) {
  try {
    const body = await req.json();
    const { name, description, price, category } = body;

    if (!name || !description || !price) {
      throw new ValidationError('Nome, descrição e preço são obrigatórios');
    }

    const serviceData: any = {
      name,
      description,
      price: Number(price),
      partner_id: req.user.id,
    };

    // Adiciona a categoria apenas se ela for fornecida e não for uma string vazia
    if (category && typeof category === 'string' && category.trim() !== '') {
      serviceData.category = category.trim();
    }

    const supabase = SupabaseService.getInstance().getAdminClient();

    const { data, error } = await supabase
      .from('partner_services') // Corrigido para a tabela correta
      .insert(serviceData)
      .select()
      .single();

    if (error) {
      throw new DatabaseError(`Erro ao criar serviço no banco de dados: ${error.message}`);
    }

    return NextResponse.json({ success: true, service: data }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

export const POST = withPartnerAuth(createServiceHandler);

import { NextResponse } from 'next/server';
import { withPartnerAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { handleApiError } from '@/lib/utils/apiErrorHandlers';
import { DatabaseError, ValidationError, NotFoundError } from '@/lib/utils/errors';

interface UpdateServiceData {
  name: string;
  description: string;
  price: number;
  category?: string | null;
}

async function updateServiceHandler(
  req: AuthenticatedRequest,
  context: { params: Promise<{ serviceId: string }> }
) {
  try {
    const { serviceId } = await context.params;

    if (!serviceId) {
      throw new ValidationError('ID do serviço é obrigatório');
    }

    const body = await req.json();
    const { name, description, price, category } = body;

    if (!name || !description || price === undefined) {
      throw new ValidationError('Nome, descrição e preço são obrigatórios');
    }

    const supabase = SupabaseService.getInstance().getAdminClient();

    // Primeiro, verificar se o serviço existe e pertence ao parceiro
    const { data: existingService, error: fetchError } = await supabase
      .from('partner_services')
      .select('id, partner_id')
      .eq('id', serviceId)
      .single();

    if (fetchError || !existingService) {
      throw new NotFoundError('Serviço não encontrado');
    }

    if (existingService.partner_id !== req.user.id) {
      throw new ValidationError('Você não tem permissão para editar este serviço');
    }

    // Preparar dados para atualização
    const updateData: UpdateServiceData = {
      name: name.trim(),
      description: description.trim(),
      price: Number(price),
    };

    // Adiciona a categoria apenas se ela for fornecida
    if (category !== undefined) {
      if (category && typeof category === 'string' && category.trim() !== '') {
        updateData.category = category.trim();
      } else {
        updateData.category = null; // Permite limpar a categoria
      }
    }

    // Atualizar o serviço
    const { data, error } = await supabase
      .from('partner_services')
      .update(updateData)
      .eq('id', serviceId)
      .eq('partner_id', req.user.id) // Garantir que só o dono pode editar
      .select()
      .single();

    if (error) {
      throw new DatabaseError(`Erro ao atualizar serviço: ${error.message}`);
    }

    return NextResponse.json({
      success: true,
      service: data,
      message: 'Serviço atualizado com sucesso',
    });
  } catch (error) {
    return handleApiError(error);
  }
}

async function deleteServiceHandler(
  req: AuthenticatedRequest,
  context: { params: Promise<{ serviceId: string }> }
) {
  try {
    const { serviceId } = await context.params;

    if (!serviceId) {
      throw new ValidationError('ID do serviço é obrigatório');
    }

    const supabase = SupabaseService.getInstance().getAdminClient();

    // Primeiro, verificar se o serviço existe e pertence ao parceiro
    const { data: existingService, error: fetchError } = await supabase
      .from('partner_services')
      .select('id, partner_id')
      .eq('id', serviceId)
      .single();

    if (fetchError || !existingService) {
      throw new NotFoundError('Serviço não encontrado');
    }

    if (existingService.partner_id !== req.user.id) {
      throw new ValidationError('Você não tem permissão para excluir este serviço');
    }

    // Excluir o serviço
    const { error } = await supabase
      .from('partner_services')
      .delete()
      .eq('id', serviceId)
      .eq('partner_id', req.user.id); // Garantir que só o dono pode excluir

    if (error) {
      throw new DatabaseError(`Erro ao excluir serviço: ${error.message}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Serviço excluído com sucesso',
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export const PUT = withPartnerAuth(updateServiceHandler);
export const DELETE = withPartnerAuth(deleteServiceHandler);

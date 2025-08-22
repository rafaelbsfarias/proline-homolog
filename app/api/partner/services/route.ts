import { NextResponse } from 'next/server';
import { withPartnerAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { handleApiError } from '@/lib/utils/apiErrorHandlers';
import { DatabaseError, ValidationError } from '@/lib/utils/errors';

async function createServiceHandler(req: AuthenticatedRequest) {
  try {
    const body = await req.json();
    const { name, description, price } = body;

    if (!name || !description || !price) {
      throw new ValidationError('Nome, descrição e preço são obrigatórios');
    }

    const supabase = SupabaseService.getInstance().getAdminClient();

    const { data, error } = await supabase
      .from('services')
      .insert({ name, description, price, partner_id: req.user.id })
      .select()
      .single();

    if (error) {
      throw new DatabaseError('Erro ao criar serviço no banco de dados.', error);
    }

    return NextResponse.json({ success: true, service: data }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

export const POST = withPartnerAuth(createServiceHandler);

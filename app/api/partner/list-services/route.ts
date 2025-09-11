import { NextResponse } from 'next/server';
import { withPartnerAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { handleApiError } from '@/lib/utils/apiErrorHandlers';
import { DatabaseError } from '@/lib/utils/errors';

async function listPartnerServices(req: AuthenticatedRequest) {
  try {
    const partnerId = req.user.id;
    const supabase = SupabaseService.getInstance().getAdminClient();

    // A tabela correta, baseada nas migrações, é `partner_services`
    const { data, error } = await supabase
      .from('partner_services')
      .select('id, name, description, price, category')
      .eq('partner_id', partnerId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new DatabaseError(`Falha ao listar os serviços do parceiro: ${error.message}`);
    }

    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error);
  }
}

export const GET = withPartnerAuth(listPartnerServices);

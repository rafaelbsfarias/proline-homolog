import { NextResponse } from 'next/server';
import {
  withSpecialistAuth,
  type AuthenticatedRequest,
} from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';

// Production-ready: no debug logs; scoped data by specialist
export const GET = withSpecialistAuth(async (req: AuthenticatedRequest) => {
  try {
    const supabase = SupabaseService.getInstance().getAdminClient();

    // Use RPC to fetch clients associated to this specialist, with vehicle counts
    const { data, error } = await supabase.rpc('get_specialist_clients_with_vehicle_count', {
      p_specialist_id: req.user.id,
    });

    if (error) {
      return NextResponse.json({ error: 'Erro ao buscar clientes' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      clients: data || [],
      count: data?.length || 0,
    });
  } catch {
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
});

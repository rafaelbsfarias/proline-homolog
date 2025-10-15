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

    // Primeiro, buscar os client_ids do especialista
    const { data: clientSpecialists, error: csError } = await supabase
      .from('client_specialists')
      .select('client_id')
      .eq('specialist_id', req.user.id);

    if (csError) {
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar clientes do especialista' },
        { status: 500 }
      );
    }

    if (!clientSpecialists || clientSpecialists.length === 0) {
      return NextResponse.json({
        success: true,
        count: 0,
      });
    }

    const clientIds = clientSpecialists.map(cs => cs.client_id);

    // Buscar vehicle_ids dos clientes
    const { data: vehicles, error: vError } = await supabase
      .from('vehicles')
      .select('id')
      .in('client_id', clientIds);

    if (vError) {
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar veículos dos clientes' },
        { status: 500 }
      );
    }

    if (!vehicles || vehicles.length === 0) {
      return NextResponse.json({
        success: true,
        count: 0,
      });
    }

    const vehicleIds = vehicles.map(v => v.id);

    // Contar part requests pendentes para esses veículos
    const { count, error } = await supabase
      .from('part_requests')
      .select('*', { count: 'exact', head: true })
      .neq('status', 'approved')
      .neq('status', 'rejected')
      .in('vehicle_id', vehicleIds);

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Erro ao contar solicitações de peças' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      count: count || 0,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
});

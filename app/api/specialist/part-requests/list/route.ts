import { NextResponse } from 'next/server';
import {
  withSpecialistAuth,
  type AuthenticatedRequest,
} from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';

async function getSpecialistPartRequestsListHandler(req: AuthenticatedRequest) {
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
        data: [],
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
        data: [],
      });
    }

    const vehicleIds = vehicles.map(v => v.id);

    // Buscar anomalias dos veículos
    const { data: anomalies, error: aError } = await supabase
      .from('vehicle_anomalies')
      .select('id')
      .in('vehicle_id', vehicleIds);

    if (aError) {
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar anomalias dos veículos' },
        { status: 500 }
      );
    }

    if (!anomalies || anomalies.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    const anomalyIds = anomalies.map(a => a.id);

    // Buscar part requests das anomalias dos veículos dos clientes do especialista
    const { data, error } = await supabase
      .from('part_requests')
      .select(
        `
        id,
        part_name,
        part_description,
        quantity,
        estimated_price,
        purchase_link,
        status,
        created_at,
        anomaly_id,
        estimated_delivery_date,
        actual_delivery_date,
        vehicle_anomalies!inner (
          vehicles!inner (
            plate
          )
        )
      `
      )
      .in('anomaly_id', anomalyIds)
      .neq('status', 'approved')
      .neq('status', 'rejected')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar solicitações de peças' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || [],
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export const GET = withSpecialistAuth(getSpecialistPartRequestsListHandler);

import { NextResponse } from 'next/server';
import { withAdminAuth } from '@/modules/common/utils/authMiddleware';
import { createApiClient } from '@/lib/supabase/api';

async function getPartRequestsListHandler() {
  try {
    const supabase = createApiClient();

    // Buscar todas as part requests com detalhes básicos
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

export const GET = withAdminAuth(getPartRequestsListHandler);

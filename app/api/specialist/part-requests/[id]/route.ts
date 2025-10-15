import { NextResponse } from 'next/server';
import {
  withSpecialistAuth,
  type AuthenticatedRequest,
} from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';

interface UpdatePartRequestBody {
  part_description?: string;
  estimated_price?: number | null;
  purchase_link?: string | null;
  status?: string;
  estimated_delivery_date?: string | null;
  actual_delivery_date?: string | null;
}

async function updateSpecialistPartRequestHandler(
  req: AuthenticatedRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID da peça solicitada é obrigatório' },
        { status: 400 }
      );
    }

    const body: UpdatePartRequestBody = await req.json();

    // Validar campos permitidos
    const allowedFields = [
      'part_description',
      'estimated_price',
      'purchase_link',
      'status',
      'estimated_delivery_date',
      'actual_delivery_date',
    ];
    const updates: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(body)) {
      if (allowedFields.includes(key)) {
        if (key === 'estimated_price' && value !== null) {
          // Converter para string como esperado pela tabela
          updates[key] = value.toString();
        } else {
          updates[key] = value;
        }
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, error: 'Nenhum campo válido para atualização' },
        { status: 400 }
      );
    }

    const supabase = SupabaseService.getInstance().getAdminClient();

    // Primeiro verificar se o especialista tem acesso a esta part request
    // Buscar os client_ids do especialista
    const { data: clientSpecialists, error: csError } = await supabase
      .from('client_specialists')
      .select('client_id')
      .eq('specialist_id', req.user.id);

    if (csError || !clientSpecialists || clientSpecialists.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Especialista não tem clientes associados' },
        { status: 403 }
      );
    }

    const clientIds = clientSpecialists.map(cs => cs.client_id);

    // Verificar se a part request pertence a um veículo de um cliente do especialista
    const { data: partRequest, error: prError } = await supabase
      .from('part_requests')
      .select(
        `
        id,
        vehicle_anomalies!inner (
          vehicle_id,
          vehicles!inner (
            client_id
          )
        )
      `
      )
      .eq('id', id)
      .single();

    if (prError || !partRequest) {
      return NextResponse.json(
        { success: false, error: 'Peça solicitada não encontrada' },
        { status: 404 }
      );
    }

    // Verificar se o cliente da peça pertence ao especialista
    const clientId = (partRequest as any).vehicle_anomalies.vehicles.client_id;
    if (!clientIds.includes(clientId)) {
      return NextResponse.json(
        { success: false, error: 'Acesso negado a esta peça solicitada' },
        { status: 403 }
      );
    }

    // Atualizar a part request
    const { data, error } = await supabase
      .from('part_requests')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Erro ao atualizar peça solicitada' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export const PATCH = withSpecialistAuth(updateSpecialistPartRequestHandler);

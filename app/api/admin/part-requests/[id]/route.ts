import { NextResponse } from 'next/server';
import { withAdminAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { createApiClient } from '@/lib/supabase/api';

interface UpdatePartRequestBody {
  part_description?: string;
  estimated_price?: number | null;
  status?: string;
  estimated_delivery_date?: string | null;
  actual_delivery_date?: string | null;
}

async function updatePartRequestHandler(
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

    const supabase = createApiClient();

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

export const PATCH = withAdminAuth(updatePartRequestHandler);

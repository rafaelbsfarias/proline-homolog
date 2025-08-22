import { NextRequest, NextResponse } from 'next/server';
import { withPartnerAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';

async function createServiceHandler(req: AuthenticatedRequest) {
  try {
    const body = await req.json();
    const { name, description, price } = body;

    if (!name || !description || !price) {
      return new Response(JSON.stringify({ error: 'Nome, descrição e preço são obrigatórios' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const supabase = SupabaseService.getInstance().getAdminClient();

    // Criar serviço
    const { data, error } = await supabase
      .from('services')
      .insert({
        name,
        description,
        price,
        partner_id: req.user.id,
      })
      .select()
      .single();

    if (error) {
      // TODO: Adicionar log de erro real aqui (e.g., Sentry, Pino)
      return new Response(JSON.stringify({ error: 'Erro ao criar serviço' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        service: data,
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    // TODO: Adicionar log de erro real aqui (e.g., Sentry, Pino)
    return new Response(JSON.stringify({ error: 'Erro interno do servidor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export const POST = withPartnerAuth(createServiceHandler);

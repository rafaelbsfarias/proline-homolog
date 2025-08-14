import { NextRequest, NextResponse } from 'next/server';
import { withPartnerAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';

async function createServiceHandler(req: AuthenticatedRequest) {
  try {
    console.log('=== CREATE SERVICE HANDLER ===');
    console.log('Partner:', req.user.email);

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
      console.error('Erro ao criar serviço:', error);
      return new Response(JSON.stringify({ error: 'Erro ao criar serviço' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log('Serviço criado com sucesso:', data.id);

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
    console.error('Erro em create service:', error);
    return new Response(JSON.stringify({ error: 'Erro interno do servidor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export const POST = withPartnerAuth(createServiceHandler);

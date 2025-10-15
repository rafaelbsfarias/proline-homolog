/**
 * GET /api/admin/quotes/pending-admin-approval
 *
 * Lista orçamentos que estão pendentes de aprovação do admin (trilha admin).
 * Faz parte do sistema de 3 trilhas de aprovação independentes.
 *
 * Retorna orçamentos onde approval_status.admin === 'pending'
 */

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // Verificar se usuário é admin
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Verificar se é admin
    const { data: adminData, error: adminError } = await supabase
      .from('admins')
      .select('profile_id')
      .eq('profile_id', user.id)
      .single();

    if (adminError || !adminData) {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas administradores podem acessar esta rota.' },
        { status: 403 }
      );
    }

    // Buscar orçamentos pendentes de aprovação do admin
    // Filtra por approval_status->>'admin' = 'pending'
    const { data: quotes, error: quotesError } = await supabase
      .from('quotes')
      .select(
        `
        id,
        created_at,
        updated_at,
        service_order_id,
        partner_id,
        total_value,
        supplier_delivery_date,
        status,
        approval_status,
        partners:partner_id (
          profile_id,
          profiles:profile_id (
            name,
            email
          )
        ),
        service_orders:service_order_id (
          id,
          vehicle_id,
          vehicles:vehicle_id (
            id,
            plate,
            model,
            brand,
            client_id,
            clients:client_id (
              profile_id,
              profiles:profile_id (
                name,
                email
              )
            )
          )
        ),
        quote_items (
          id,
          description,
          quantity,
          unit_price,
          total_price,
          estimated_days
        )
      `
      )
      .filter('approval_status->admin', 'eq', 'pending')
      .order('created_at', { ascending: false });

    if (quotesError) {
      return NextResponse.json(
        { error: 'Erro ao buscar orçamentos', details: quotesError.message },
        { status: 500 }
      );
    }

    // Formatar resposta
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const formattedQuotes = quotes.map((quote: any) => {
      const partner = Array.isArray(quote.partners) ? quote.partners[0] : quote.partners;
      const serviceOrder = Array.isArray(quote.service_orders)
        ? quote.service_orders[0]
        : quote.service_orders;
      const vehicle = serviceOrder?.vehicles;
      const client = Array.isArray(vehicle?.clients) ? vehicle?.clients[0] : vehicle?.clients;

      return {
        id: quote.id,
        created_at: quote.created_at,
        updated_at: quote.updated_at,
        status: quote.status,
        approval_status: quote.approval_status,
        total_value: quote.total_value,
        supplier_delivery_date: quote.supplier_delivery_date,
        partner: {
          id: quote.partner_id,
          name: partner?.profiles?.name || 'N/A',
          email: partner?.profiles?.email || 'N/A',
        },
        vehicle: {
          id: vehicle?.id,
          plate: vehicle?.plate || 'N/A',
          model: vehicle?.model || 'N/A',
          brand: vehicle?.brand || 'N/A',
        },
        client: {
          id: client?.profile_id,
          name: client?.profiles?.name || 'N/A',
          email: client?.profiles?.email || 'N/A',
        },
        items_count: quote.quote_items?.length || 0,
        total_items_value:
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          quote.quote_items?.reduce(
            (sum: number, item: any) => sum + (Number(item.total_price) || 0),
            0
          ) || 0,
      };
    });

    return NextResponse.json({
      success: true,
      data: formattedQuotes,
      count: formattedQuotes.length,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}

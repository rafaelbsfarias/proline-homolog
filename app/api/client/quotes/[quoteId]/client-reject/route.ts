/**
 * POST /api/client/quotes/[quoteId]/client-reject
 *
 * Rejeita um orçamento na trilha de aprovação do cliente (novo sistema 3 trilhas).
 * Atualiza approval_status.client para 'rejected'.
 *
 * Body:
 * {
 *   rejection_reason: string (obrigatório)
 *   comments?: string
 * }
 */

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request, { params }: { params: { quoteId: string } }) {
  try {
    const supabase = await createClient();
    const { quoteId } = params;

    // Verificar autenticação
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Verificar se é cliente
    const { data: clientData, error: clientError } = await supabase
      .from('clients')
      .select('profile_id')
      .eq('profile_id', user.id)
      .single();

    if (clientError || !clientData) {
      return NextResponse.json({ error: 'Acesso negado. Apenas clientes.' }, { status: 403 });
    }

    // Parsear body
    const body = await request.json();
    const { rejection_reason, comments } = body;

    // Validar que rejection_reason é obrigatório
    if (!rejection_reason || rejection_reason.trim().length === 0) {
      return NextResponse.json(
        { error: 'Campo "rejection_reason" é obrigatório ao rejeitar orçamento' },
        { status: 400 }
      );
    }

    // Buscar orçamento e verificar se pertence ao cliente
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .select(
        `
        id,
        approval_status,
        service_order_id,
        service_orders!inner (
          vehicle_id,
          vehicles!inner (
            client_id
          )
        )
      `
      )
      .eq('id', quoteId)
      .single();

    if (quoteError || !quote) {
      return NextResponse.json({ error: 'Orçamento não encontrado' }, { status: 404 });
    }

    // Verificar se o orçamento pertence ao cliente
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const serviceOrders: any = Array.isArray(quote.service_orders)
      ? quote.service_orders[0]
      : quote.service_orders;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const vehicles: any = Array.isArray(serviceOrders?.vehicles)
      ? serviceOrders.vehicles[0]
      : serviceOrders?.vehicles;

    if (vehicles?.client_id !== user.id) {
      return NextResponse.json({ error: 'Este orçamento não pertence a você' }, { status: 403 });
    }

    // Atualizar approval_status.client para 'rejected'
    const currentApprovalStatus = quote.approval_status || {
      admin: 'pending',
      specialist_time: 'pending',
      client: 'pending',
    };

    const newApprovalStatus = {
      ...currentApprovalStatus,
      client: 'rejected',
    };

    const { error: updateError } = await supabase
      .from('quotes')
      .update({
        approval_status: newApprovalStatus,
        status: 'rejected', // Atualiza status geral para rejected também
      })
      .eq('id', quoteId);

    if (updateError) {
      return NextResponse.json(
        { error: 'Erro ao rejeitar orçamento', details: updateError.message },
        { status: 500 }
      );
    }

    // Registrar rejeição na tabela quote_client_approvals
    const { error: approvalError } = await supabase.from('quote_client_approvals').insert({
      quote_id: quoteId,
      client_id: user.id,
      decision: 'rejected',
      rejection_reason: rejection_reason,
      comments: comments || null,
    });

    if (approvalError) {
      return NextResponse.json(
        {
          error: 'Erro ao registrar rejeição',
          details: approvalError.message,
        },
        { status: 500 }
      );
    }

    // Buscar status atualizado
    const { data: updatedQuote } = await supabase
      .from('quotes')
      .select('id, status, approval_status')
      .eq('id', quoteId)
      .single();

    return NextResponse.json({
      success: true,
      message: 'Orçamento rejeitado com sucesso',
      data: {
        quote_id: quoteId,
        approval_status: updatedQuote?.approval_status,
        status: updatedQuote?.status,
        rejection_reason: rejection_reason,
      },
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

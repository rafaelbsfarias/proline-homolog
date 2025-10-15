/**
 * POST /api/admin/quotes/[quoteId]/admin-request-revision
 *
 * Solicita revisão de um orçamento na trilha de aprovação do admin.
 * Atualiza approval_status.admin para 'revision_requested'.
 *
 * Body:
 * {
 *   comments: string (obrigatório)
 *   revision_items?: array
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

    // Verificar se é admin
    const { data: adminData, error: adminError } = await supabase
      .from('admins')
      .select('profile_id')
      .eq('profile_id', user.id)
      .single();

    if (adminError || !adminData) {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas administradores.' },
        { status: 403 }
      );
    }

    // Parsear body
    const body = await request.json();
    const { comments, revision_items } = body;

    // Validar que comments é obrigatório
    if (!comments || comments.trim().length === 0) {
      return NextResponse.json(
        { error: 'Campo "comments" é obrigatório ao solicitar revisão' },
        { status: 400 }
      );
    }

    // Buscar orçamento atual
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .select('id, approval_status')
      .eq('id', quoteId)
      .single();

    if (quoteError || !quote) {
      return NextResponse.json({ error: 'Orçamento não encontrado' }, { status: 404 });
    }

    // Atualizar approval_status.admin para 'revision_requested'
    const currentApprovalStatus = quote.approval_status || {
      admin: 'pending',
      specialist_time: 'pending',
      client: 'pending',
    };

    const newApprovalStatus = {
      ...currentApprovalStatus,
      admin: 'revision_requested',
    };

    const { error: updateError } = await supabase
      .from('quotes')
      .update({ approval_status: newApprovalStatus })
      .eq('id', quoteId);

    if (updateError) {
      return NextResponse.json(
        {
          error: 'Erro ao solicitar revisão',
          details: updateError.message,
        },
        { status: 500 }
      );
    }

    // Registrar solicitação de revisão na tabela quote_admin_approvals
    const { error: approvalError } = await supabase.from('quote_admin_approvals').insert({
      quote_id: quoteId,
      admin_id: user.id,
      decision: 'revision_requested',
      comments: comments,
      reviewed_values: { revision_items: revision_items || [] },
    });

    if (approvalError) {
      return NextResponse.json(
        {
          error: 'Erro ao registrar solicitação de revisão',
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
      message: 'Revisão solicitada com sucesso',
      data: {
        quote_id: quoteId,
        approval_status: updatedQuote?.approval_status,
        status: updatedQuote?.status,
        comments: comments,
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

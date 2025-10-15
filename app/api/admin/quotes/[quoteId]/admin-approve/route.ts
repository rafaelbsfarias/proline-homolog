/**
 * POST /api/admin/quotes/[quoteId]/admin-approve
 *
 * Aprova um orçamento na trilha de aprovação do admin.
 * Atualiza approval_status.admin para 'approved'.
 *
 * Body:
 * {
 *   comments?: string
 *   reviewed_values?: object
 * }
 */

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request, { params }: { params: Promise<{ quoteId: string }> }) {
  try {
    const supabase = await createClient();
    const { quoteId } = await params;

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
    const { comments, reviewed_values } = body;

    // Buscar orçamento atual
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .select('id, approval_status')
      .eq('id', quoteId)
      .single();

    if (quoteError || !quote) {
      return NextResponse.json({ error: 'Orçamento não encontrado' }, { status: 404 });
    }

    // Verificar se já foi aprovado
    const currentApprovalStatus = quote.approval_status || {
      admin: 'pending',
      specialist_time: 'pending',
      client: 'pending',
    };

    if (currentApprovalStatus.admin === 'approved') {
      return NextResponse.json({ error: 'Orçamento já aprovado pelo admin' }, { status: 400 });
    }

    // Atualizar approval_status.admin para 'approved'
    const newApprovalStatus = {
      ...currentApprovalStatus,
      admin: 'approved',
    };

    const { error: updateError } = await supabase
      .from('quotes')
      .update({ approval_status: newApprovalStatus })
      .eq('id', quoteId);

    if (updateError) {
      return NextResponse.json(
        { error: 'Erro ao aprovar orçamento', details: updateError.message },
        { status: 500 }
      );
    }

    // Registrar aprovação na tabela quote_admin_approvals
    const { error: approvalError } = await supabase.from('quote_admin_approvals').insert({
      quote_id: quoteId,
      admin_id: user.id,
      decision: 'approved',
      comments: comments || null,
      reviewed_values: reviewed_values || {},
    });

    if (approvalError) {
      return NextResponse.json(
        {
          error: 'Erro ao registrar aprovação',
          details: approvalError.message,
        },
        { status: 500 }
      );
    }

    // Verificar se todas as 3 trilhas foram aprovadas (o trigger fará isso automaticamente)
    // Mas vamos retornar o status atualizado
    const { data: updatedQuote } = await supabase
      .from('quotes')
      .select('id, status, approval_status')
      .eq('id', quoteId)
      .single();

    return NextResponse.json({
      success: true,
      message: 'Orçamento aprovado pelo admin com sucesso',
      data: {
        quote_id: quoteId,
        approval_status: updatedQuote?.approval_status,
        status: updatedQuote?.status,
        all_approved:
          updatedQuote?.approval_status?.admin === 'approved' &&
          updatedQuote?.approval_status?.specialist_time === 'approved' &&
          updatedQuote?.approval_status?.client === 'approved',
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

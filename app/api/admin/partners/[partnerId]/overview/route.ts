import { NextResponse } from 'next/server';
import { withAdminAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { getLogger } from '@/modules/logger';

const logger = getLogger('api:admin:partner:overview');

export const GET = withAdminAuth(
  async (_req: AuthenticatedRequest, ctx: { params: Promise<{ partnerId: string }> }) => {
    try {
      const { partnerId } = await ctx.params;
      const admin = SupabaseService.getInstance().getAdminClient();

      // Partner basic info
      const { data: partner, error: partnerErr } = await admin
        .from('partners')
        .select('profile_id, company_name, is_active')
        .eq('profile_id', partnerId)
        .maybeSingle();

      if (partnerErr) {
        logger.error('failed_fetch_partner', { error: partnerErr, partnerId });
        return NextResponse.json({ error: 'Erro ao buscar parceiro' }, { status: 500 });
      }
      if (!partner) {
        return NextResponse.json({ error: 'Parceiro não encontrado' }, { status: 404 });
      }

      // Services count
      const { count: servicesCount, error: servicesErr } = await admin
        .from('partner_services')
        .select('*', { count: 'exact', head: true })
        .eq('partner_id', partnerId);
      if (servicesErr) {
        logger.error('failed_services_count', { error: servicesErr, partnerId });
        return NextResponse.json({ error: 'Erro ao contar serviços do parceiro' }, { status: 500 });
      }

      // Pending budgets (admin) — include legacy 'admin_review' for compatibility
      const { count: pendingAdmin, error: q1Err } = await admin
        .from('quotes')
        .select('*', { count: 'exact', head: true })
        .eq('partner_id', partnerId)
        .in('status', ['pending_admin_approval', 'admin_review']);
      if (q1Err) {
        logger.error('failed_pending_admin', { error: q1Err, partnerId });
        return NextResponse.json(
          { error: 'Erro ao contar orçamentos pendentes (admin)' },
          { status: 500 }
        );
      }

      // Pending budgets (client approval)
      const { count: pendingClient, error: q2Err } = await admin
        .from('quotes')
        .select('*', { count: 'exact', head: true })
        .eq('partner_id', partnerId)
        .eq('status', 'pending_client_approval');
      if (q2Err) {
        logger.error('failed_pending_client', { error: q2Err, partnerId });
        return NextResponse.json(
          { error: 'Erro ao contar orçamentos para aprovação' },
          { status: 500 }
        );
      }

      // Pending budgets (partner) — quotes aguardando parceiro preencher
      const { count: pendingPartner, error: q3Err } = await admin
        .from('quotes')
        .select('*', { count: 'exact', head: true })
        .eq('partner_id', partnerId)
        .eq('status', 'pending_partner');
      if (q3Err) {
        logger.error('failed_pending_partner', { error: q3Err, partnerId });
        return NextResponse.json(
          { error: 'Erro ao contar orçamentos pendentes (parceiro)' },
          { status: 500 }
        );
      }

      // Executing budgets: approved quotes + distinct service orders in progress with quotes for this partner
      // Primeiro, buscar quotes aprovados para este parceiro
      const { data: approvedQuotes, error: approvedErr } = await admin
        .from('quotes')
        .select('service_order_id')
        .eq('partner_id', partnerId)
        .eq('status', 'approved');

      if (approvedErr) {
        logger.error('failed_fetch_approved_quotes', { error: approvedErr, partnerId });
        return NextResponse.json({ error: 'Erro ao buscar orçamentos aprovados' }, { status: 500 });
      }

      // Depois, buscar service orders em progresso
      const { data: soInProgress, error: soErr } = await admin
        .from('service_orders')
        .select('id')
        .eq('status', 'in_progress');
      if (soErr) {
        logger.error('failed_fetch_so_in_progress', { error: soErr, partnerId });
        return NextResponse.json(
          { error: 'Erro ao buscar ordens de serviço em execução' },
          { status: 500 }
        );
      }

      // Combinar ambos usando Set para evitar duplicatas
      const executingSoSet = new Set<string>();

      // Adicionar service_orders dos quotes aprovados
      (approvedQuotes || []).forEach(q => {
        if (q.service_order_id) executingSoSet.add(q.service_order_id as string);
      });

      // Adicionar service_orders em progresso que têm quotes deste parceiro
      if (soInProgress && soInProgress.length) {
        const soIds = soInProgress.map(r => r.id as string);
        const { data: quotesForSo, error: qInProgErr } = await admin
          .from('quotes')
          .select('service_order_id')
          .eq('partner_id', partnerId)
          .in('service_order_id', soIds);
        if (qInProgErr) {
          logger.error('failed_fetch_quotes_for_so', { error: qInProgErr, partnerId });
          return NextResponse.json(
            { error: 'Erro ao buscar orçamentos em execução' },
            { status: 500 }
          );
        }
        (quotesForSo || []).forEach(q => {
          if (q.service_order_id) executingSoSet.add(q.service_order_id as string);
        });
      }

      const executing = executingSoSet.size;

      // Load quotes list for this partner and group by status
      const { data: partnerQuotes, error: quotesErr } = await admin
        .from('quotes')
        .select('id, created_at, status, total_value, service_order_id')
        .eq('partner_id', partnerId)
        .order('created_at', { ascending: false });
      if (quotesErr) {
        logger.error('failed_fetch_partner_quotes', { error: quotesErr, partnerId });
        return NextResponse.json(
          { error: 'Erro ao buscar orçamentos do parceiro' },
          { status: 500 }
        );
      }

      const byStatus = {
        pending_admin_approval: [] as Array<{
          id: string;
          created_at: string;
          status: string;
          total_value: number | null;
          service_order_id: string | null;
        }>,
        pending_client_approval: [] as Array<{
          id: string;
          created_at: string;
          status: string;
          total_value: number | null;
          service_order_id: string | null;
        }>,
        approved: [] as Array<{
          id: string;
          created_at: string;
          status: string;
          total_value: number | null;
          service_order_id: string | null;
        }>,
        rejected: [] as Array<{
          id: string;
          created_at: string;
          status: string;
          total_value: number | null;
          service_order_id: string | null;
        }>,
        executing: [] as Array<{
          id: string;
          created_at: string;
          status: string;
          total_value: number | null;
          service_order_id: string | null;
        }>,
      };

      // Set de service orders em progresso para classificação
      const soSet = new Set((soInProgress || []).map(r => r.id as string));

      (partnerQuotes || []).forEach(q => {
        // Map legacy 'admin_review' into 'pending_admin_approval'
        const statusKey = q.status === 'admin_review' ? 'pending_admin_approval' : q.status;

        const item = {
          id: q.id,
          created_at: q.created_at,
          status: statusKey,
          total_value: q.total_value,
          service_order_id: q.service_order_id,
        };

        // Se o service_order está em progresso, classificar como executing
        // independente do status do quote
        if (q.service_order_id && soSet.has(q.service_order_id as string)) {
          byStatus.executing.push(item);
        } else {
          // Caso contrário, classificar pelo status do quote
          if (statusKey in byStatus) {
            byStatus[statusKey as keyof typeof byStatus].push(item);
          }
        }
      });

      const result = {
        id: partner.profile_id as string,
        company_name: (partner.company_name as string) || '',
        services_count: servicesCount || 0,
        // Orçamentos pendentes: aguardando parceiro preencher (pending_partner)
        pending_budgets: pendingPartner || 0,
        executing_budgets: executing,
        // Para Aprovação: aguardando aprovação do ADMIN (pending_admin_approval)
        // + aguardando aprovação do CLIENTE (pending_client_approval)
        approval_budgets: (pendingAdmin || 0) + (pendingClient || 0),
        is_active: !!partner.is_active,
        quotes: byStatus,
      };

      return NextResponse.json({ partner: result });
    } catch (error) {
      logger.error('partner_overview_error', { error });
      return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
  }
);

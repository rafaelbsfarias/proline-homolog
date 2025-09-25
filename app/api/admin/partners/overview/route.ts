import { NextResponse } from 'next/server';
import { withAdminAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { getLogger } from '@/modules/logger';

const logger = getLogger('api:admin:partners:overview');

type PartnerRow = {
  profile_id: string;
  company_name: string | null;
  is_active: boolean | null;
};

export const GET = withAdminAuth(async (_req: AuthenticatedRequest) => {
  try {
    const admin = SupabaseService.getInstance().getAdminClient();

    // 1) Base partners list (active)
    const { data: partners, error: partnersErr } = await admin
      .from('partners')
      .select('profile_id, company_name, is_active')
      .eq('is_active', true);

    if (partnersErr) {
      logger.error('failed_fetch_partners', { error: partnersErr });
      return NextResponse.json({ error: 'Erro ao buscar parceiros' }, { status: 500 });
    }

    const partnerRows = (partners || []) as PartnerRow[];
    const partnerIds = partnerRows.map(p => p.profile_id);

    // Early return if none
    if (partnerIds.length === 0) {
      return NextResponse.json({ partners: [] });
    }

    // 2) Services count per partner
    const { data: allServices, error: servicesErr } = await admin
      .from('partner_services')
      .select('partner_id');

    if (servicesErr) {
      logger.error('failed_fetch_partner_services', { error: servicesErr });
      return NextResponse.json({ error: 'Erro ao buscar serviços de parceiros' }, { status: 500 });
    }

    const servicesCountByPartner = new Map<string, number>();
    (allServices || []).forEach(r => {
      const k = r.partner_id as string;
      servicesCountByPartner.set(k, (servicesCountByPartner.get(k) || 0) + 1);
    });

    // 3) Quotes counts by status
    const { data: pendingAdminQuotes, error: pendingAdminErr } = await admin
      .from('quotes')
      .select('partner_id')
      .eq('status', 'pending_admin_approval');

    if (pendingAdminErr) {
      logger.error('failed_fetch_pending_admin_quotes', { error: pendingAdminErr });
      return NextResponse.json(
        { error: 'Erro ao buscar orçamentos pendentes (admin)' },
        { status: 500 }
      );
    }

    const { data: pendingClientQuotes, error: pendingClientErr } = await admin
      .from('quotes')
      .select('partner_id')
      .eq('status', 'pending_client_approval');

    if (pendingClientErr) {
      logger.error('failed_fetch_pending_client_quotes', { error: pendingClientErr });
      return NextResponse.json(
        { error: 'Erro ao buscar orçamentos pendentes (cliente)' },
        { status: 500 }
      );
    }

    const pendingAdminByPartner = new Map<string, number>();
    (pendingAdminQuotes || []).forEach(r => {
      const k = r.partner_id as string;
      pendingAdminByPartner.set(k, (pendingAdminByPartner.get(k) || 0) + 1);
    });

    const pendingClientByPartner = new Map<string, number>();
    (pendingClientQuotes || []).forEach(r => {
      const k = r.partner_id as string;
      pendingClientByPartner.set(k, (pendingClientByPartner.get(k) || 0) + 1);
    });

    // 4) Executing budgets (service_orders in_progress with quotes for partner)
    const { data: inProgressOrders, error: inProgressErr } = await admin
      .from('service_orders')
      .select('id')
      .eq('status', 'in_progress');

    if (inProgressErr) {
      logger.error('failed_fetch_in_progress_orders', { error: inProgressErr });
      return NextResponse.json(
        { error: 'Erro ao buscar ordens de serviço em execução' },
        { status: 500 }
      );
    }

    const soIds = (inProgressOrders || []).map(r => r.id as string);

    let executingByPartner = new Map<string, number>();
    if (soIds.length > 0) {
      const { data: quotesForInProgress, error: quotesInProgErr } = await admin
        .from('quotes')
        .select('partner_id, service_order_id')
        .in('service_order_id', soIds);

      if (quotesInProgErr) {
        logger.error('failed_fetch_quotes_for_in_progress', { error: quotesInProgErr });
        return NextResponse.json(
          { error: 'Erro ao buscar orçamentos em execução' },
          { status: 500 }
        );
      }

      // Count distinct service_order_id per partner
      const mapDistinct = new Map<string, Set<string>>();
      (quotesForInProgress || []).forEach(r => {
        const pid = r.partner_id as string;
        const so = r.service_order_id as string;
        if (!mapDistinct.has(pid)) mapDistinct.set(pid, new Set());
        mapDistinct.get(pid)!.add(so);
      });

      executingByPartner = new Map(
        Array.from(mapDistinct.entries()).map(([pid, set]) => [pid, set.size])
      );
    }

    // 5) Merge result preserving expected shape
    const result = partnerRows
      .filter(p => partnerIds.includes(p.profile_id))
      .sort((a, b) => (a.company_name || '').localeCompare(b.company_name || ''))
      .map(p => ({
        id: p.profile_id,
        company_name: p.company_name || '',
        services_count: servicesCountByPartner.get(p.profile_id) || 0,
        pending_budgets: pendingAdminByPartner.get(p.profile_id) || 0,
        executing_budgets: executingByPartner.get(p.profile_id) || 0,
        approval_budgets: pendingClientByPartner.get(p.profile_id) || 0,
      }));

    logger.info('partners_overview_ok', { count: result.length });
    return NextResponse.json({ partners: result });
  } catch (error) {
    logger.error('partners_overview_error', { error });
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
});

import { NextResponse } from 'next/server';
import { withAdminAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { getLogger } from '@/modules/logger';

const logger = getLogger('api:admin:vehicles');

export const GET = withAdminAuth(async (req: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const plate = searchParams.get('plate');
    const client = searchParams.get('client');
    const q = searchParams.get('q');
    const statusParam = searchParams.get('status');
    const preparacao = (searchParams.get('preparacao') || '').toLowerCase() === 'true';
    const comercializacao = (searchParams.get('comercializacao') || '').toLowerCase() === 'true';
    const pageParam = parseInt(searchParams.get('page') || '1', 10);
    const limitParam = parseInt(searchParams.get('limit') || '10', 10);
    const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
    const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 100) : 10;
    const offset = (page - 1) * limit;

    const supabase = SupabaseService.getInstance().getAdminClient();

    // Helper to apply shared filters
    const applySharedFilters = (q: any) => {
      let queryRef = q;
      if (plate && plate.trim()) {
        queryRef = queryRef.ilike('plate', `%${plate.trim()}%`);
      }
      if (client && client.trim()) {
        queryRef = queryRef.ilike('clients.company_name', `%${client.trim()}%`);
      }
      if (preparacao) {
        queryRef = queryRef.eq('preparacao', true);
      }
      if (comercializacao) {
        queryRef = queryRef.eq('comercializacao', true);
      }
      return queryRef;
    };

    // base query
    let query = supabase
      .from('vehicles')
      .select(
        'id, plate, brand, model, status, created_at, preparacao, comercializacao, clients ( company_name )',
        {
          count: 'exact',
        }
      )
      .order('created_at', { ascending: false });

    query = applySharedFilters(query);
    const statusFilters = (statusParam || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
    if (statusFilters.length > 0) {
      // PostgREST .in is case-sensitive; assume provided statuses match DB
      query = query.in('status', statusFilters);
    }
    // Quando há busca livre (q), precisamos aplicar OR sobre campos da tabela base
    // e também sobre o campo relacionado (clients.company_name). Como PostgREST
    // não aceita OR cruzando tabelas facilmente na mesma expressão, fazemos duas
    // consultas e unificamos no servidor.
    if (q && q.trim()) {
      const like = `%${q.trim()}%`;
      const baseQuery = applySharedFilters(
        supabase
          .from('vehicles')
          .select(
            'id, plate, brand, model, status, created_at, preparacao, comercializacao, clients ( company_name )'
          )
          .or(`plate.ilike.${like},status.ilike.${like}`)
      );
      const clientQuery = applySharedFilters(
        supabase
          .from('vehicles')
          .select(
            'id, plate, brand, model, status, created_at, preparacao, comercializacao, clients ( company_name )'
          )
          .ilike('clients.company_name', like)
      );

      // Apply explicit status filters for q branch as well
      let baseQ = baseQuery;
      let clientQ = clientQuery;
      if (statusFilters.length > 0) {
        baseQ = baseQ.in('status', statusFilters);
        clientQ = clientQ.in('status', statusFilters);
      }

      // limit safeguards
      baseQ = (baseQ as any).limit(2000);
      clientQ = (clientQ as any).limit(2000);

      const [baseRes, clientRes] = await Promise.all([baseQ, clientQ]);
      if (baseRes.error && clientRes.error) {
        const errMsg = baseRes.error?.message || clientRes.error?.message || 'Erro ao buscar';
        logger.error('vehicles:list:error_q_dual', { error: errMsg });
        return NextResponse.json({ success: false, error: errMsg }, { status: 500 });
      }

      const merged = [...(baseRes.data || []), ...(clientRes.data || [])];
      const byId = new Map<string, any>();
      merged.forEach(v => {
        if (!v?.id) return;
        byId.set(v.id, v);
      });
      const all = Array.from(byId.values()).sort(
        (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      const total = all.length;
      const pageSlice = all.slice(offset, offset + limit);

      const vehicles = (pageSlice || []).map(v => ({
        id: v.id,
        plate: v.plate,
        brand: (v as any).brand ?? null,
        model: (v as any).model ?? null,
        status: (v as any).status ?? null,
        created_at: v.created_at,
        client_company: (v as any).clients?.company_name ?? null,
      }));

      // Build status counts for chips (ignoring explicit status filters)
      const statusCountsRes = await applySharedFilters(supabase.from('vehicles').select('status'));
      if (statusCountsRes.error) {
        logger.warn('vehicles:list:status_counts_q:error', {
          error: statusCountsRes.error.message,
        });
      }
      const statusCounts: Record<string, number> = {};
      (statusCountsRes.data || []).forEach((row: any) => {
        const s =
          String(row?.status || '')
            .toUpperCase()
            .trim() || '-';
        statusCounts[s] = (statusCounts[s] || 0) + 1;
      });

      return NextResponse.json({
        success: true,
        vehicles,
        total,
        page,
        pageSize: limit,
        statusCounts,
      });
    }

    // Paginação para cenário sem q: usar range e count do PostgREST
    const { data, error, count } = await query.range(offset, offset + limit - 1);
    if (error) {
      logger.error('vehicles:list:error', { error: error.message });
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const vehicles = (data || []).map(v => ({
      id: v.id,
      plate: v.plate,
      brand: (v as any).brand ?? null,
      model: (v as any).model ?? null,
      status: (v as any).status ?? null,
      created_at: v.created_at,
      client_company: (v as any).clients?.company_name ?? null,
    }));

    // Status counts for chips (ignoring explicit status filters)
    const statusCountsRes = await applySharedFilters(supabase.from('vehicles').select('status'));
    if ((statusCountsRes as any).error) {
      logger.warn('vehicles:list:status_counts:error', {
        error: (statusCountsRes as any).error.message,
      });
    }
    const statusCounts: Record<string, number> = {};
    ((statusCountsRes as any).data || []).forEach((row: any) => {
      const s =
        String(row?.status || '')
          .toUpperCase()
          .trim() || '-';
      statusCounts[s] = (statusCounts[s] || 0) + 1;
    });

    return NextResponse.json({
      success: true,
      vehicles,
      total: count || vehicles.length,
      page,
      pageSize: limit,
      statusCounts,
    });
  } catch (e: any) {
    logger.error('vehicles:list:unexpected', { error: e?.message });
    return NextResponse.json({ success: false, error: 'Erro ao listar veículos' }, { status: 500 });
  }
});

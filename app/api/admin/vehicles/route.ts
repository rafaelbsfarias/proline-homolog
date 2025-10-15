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
    const pageParam = parseInt(searchParams.get('page') || '1', 10);
    const limitParam = parseInt(searchParams.get('limit') || '10', 10);
    const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
    const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 100) : 10;
    const offset = (page - 1) * limit;

    const supabase = SupabaseService.getInstance().getAdminClient();

    // base query
    let query = supabase
      .from('vehicles')
      .select('id, plate, brand, model, status, created_at, clients ( company_name )', {
        count: 'exact',
      })
      .order('created_at', { ascending: false });

    if (plate && plate.trim()) {
      query = query.ilike('plate', `%${plate.trim()}%`);
    }
    if (client && client.trim()) {
      query = query.ilike('clients.company_name', `%${client.trim()}%`);
    }
    // Quando há busca livre (q), precisamos aplicar OR sobre campos da tabela base
    // e também sobre o campo relacionado (clients.company_name). Como PostgREST
    // não aceita OR cruzando tabelas facilmente na mesma expressão, fazemos duas
    // consultas e unificamos no servidor.
    if (q && q.trim()) {
      const like = `%${q.trim()}%`;
      const baseQuery = query.or(`plate.ilike.${like},status.ilike.${like}`).limit(1000);
      const clientQuery = query.ilike('clients.company_name', like).limit(1000);

      const [baseRes, clientRes] = await Promise.all([baseQuery, clientQuery]);
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

      return NextResponse.json({ success: true, vehicles, total, page, pageSize: limit });
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

    return NextResponse.json({
      success: true,
      vehicles,
      total: count || vehicles.length,
      page,
      pageSize: limit,
    });
  } catch (e: any) {
    logger.error('vehicles:list:unexpected', { error: e?.message });
    return NextResponse.json({ success: false, error: 'Erro ao listar veículos' }, { status: 500 });
  }
});

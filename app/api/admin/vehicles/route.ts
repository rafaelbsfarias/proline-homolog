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

    const supabase = SupabaseService.getInstance().getAdminClient();

    // base query
    let query = supabase
      .from('vehicles')
      .select('id, plate, brand, model, status, created_at, clients ( company_name )')
      .order('created_at', { ascending: false })
      .limit(200);

    if (plate && plate.trim()) {
      query = query.ilike('plate', `%${plate.trim()}%`);
    }
    if (client && client.trim()) {
      query = query.ilike('clients.company_name', `%${client.trim()}%`);
    }
    if (q && q.trim()) {
      // Busca em placa, cliente (company_name) e status
      const like = `%${q.trim()}%`;
      query = query.or(
        `plate.ilike.${like},clients.company_name.ilike.${like},status.ilike.${like}`
      );
    }

    const { data, error } = await query;
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

    return NextResponse.json({ success: true, vehicles });
  } catch (e: any) {
    logger.error('vehicles:list:unexpected', { error: e?.message });
    return NextResponse.json({ success: false, error: 'Erro ao listar veículos' }, { status: 500 });
  }
});

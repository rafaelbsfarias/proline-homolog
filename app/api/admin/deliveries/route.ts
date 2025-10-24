import { NextResponse } from 'next/server';
import { withAdminAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { getLogger } from '@/modules/logger';

const logger = getLogger('api:admin:deliveries:list');

export const GET = withAdminAuth(async (req: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || undefined;
    const clientId = searchParams.get('clientId') || undefined;
    const addressId = searchParams.get('addressId') || undefined;
    const dateStart = searchParams.get('dateStart') || undefined;
    const dateEnd = searchParams.get('dateEnd') || undefined;

    const admin = SupabaseService.getInstance().getAdminClient();
    let query = admin.from('delivery_requests').select(
      `id, status, desired_date, created_at, fee_amount,
         client:clients(profile_id, profiles(full_name)),
         vehicle:vehicles(id, plate),
         address:addresses(id, street, number, city)`
    );

    if (status) query = query.eq('status', status);
    if (clientId) query = query.eq('client_id', clientId);
    if (addressId) query = query.eq('address_id', addressId);
    if (dateStart) query = query.gte('desired_date', dateStart);
    if (dateEnd) query = query.lte('desired_date', dateEnd);

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;

    const totals: Record<string, number> = {};
    (data || []).forEach(r => {
      totals[r.status] = (totals[r.status] || 0) + 1;
    });

    return NextResponse.json({ success: true, items: data || [], totals });
  } catch (e) {
    logger.error('list_error', { e });
    return NextResponse.json({ error: 'Erro ao listar entregas' }, { status: 500 });
  }
});

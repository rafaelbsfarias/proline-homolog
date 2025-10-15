import { NextResponse } from 'next/server';
import { withAdminAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';

export const GET = withAdminAuth(async (_req: AuthenticatedRequest) => {
  const admin = SupabaseService.getInstance().getAdminClient();

  // 1) Fetch pending admin quotes (including minimal vehicle info)
  const { data: quotes, error } = await admin
    .from('quotes')
    .select(
      `
        id,
        created_at,
        status,
        total_value,
        partner_id,
        service_order_id,
        service_orders (
          id,
          order_code,
          vehicle_id,
          vehicles (
            id,
            plate,
            brand,
            model
          )
        )
      `
    )
    .in('status', ['pending_admin_approval', 'admin_review'])
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message, quotes: [] }, { status: 500 });
  }

  const partnerIds = Array.from(
    new Set((quotes || []).map(q => (q as any).partner_id).filter(Boolean))
  );

  // 2) Resolve partner names
  const partnerNameById = new Map<string, string>();
  if (partnerIds.length > 0) {
    const { data: partners } = await admin
      .from('partners')
      .select('profile_id, company_name')
      .in('profile_id', partnerIds);
    (partners || []).forEach(row =>
      partnerNameById.set(row.profile_id as string, (row.company_name as string) || '')
    );
  }

  // 3) Normalize response shape for UI
  const normalized = (quotes || []).map(row => {
    const so = Array.isArray((row as any).service_orders)
      ? (row as any).service_orders[0]
      : (row as any).service_orders;
    const vehicle = so?.vehicles;

    return {
      id: (row as any).id as string,
      created_at: (row as any).created_at as string,
      status: (row as any).status as string,
      total_value: (row as any).total_value as number | null,
      partner_id: (row as any).partner_id as string | null,
      partner_name: partnerNameById.get((row as any).partner_id) || '',
      service_order_id: (row as any).service_order_id as string | null,
      vehicle_id: so?.vehicle_id as string | null,
      vehicle_plate: (vehicle?.plate as string) || null,
      vehicle_brand: (vehicle?.brand as string) || null,
      vehicle_model: (vehicle?.model as string) || null,
    };
  });

  return NextResponse.json({ quotes: normalized });
});

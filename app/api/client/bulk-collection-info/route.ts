import { NextResponse } from 'next/server';
import { withClientAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { listAddresses } from '@/modules/client/services/list-addresses';
import { getVehicleStatusCounts } from '@/modules/client/services/get-vehicle-status-counts';

export const dynamic = 'force-dynamic';

async function bulkCollectionInfoHandler(req: AuthenticatedRequest) {
  try {
    const profile = req.user;

    if (profile.role !== 'client') {
      return NextResponse.json({ error: 'Acesso não autorizado' }, { status: 403 });
    }

    const supabase = SupabaseService.getInstance().getAdminClient();

    const [addressesResponse, statusCountsResponse, vehiclesResponse] = await Promise.all([
      listAddresses(supabase, profile.id),
      getVehicleStatusCounts(supabase, { clientId: profile.id }),
      supabase.from('vehicles').select('id, status').eq('client_id', profile.id),
    ]);

    if (addressesResponse.error) throw new Error(addressesResponse.error.message);
    if (statusCountsResponse.error) throw new Error(statusCountsResponse.error.message);
    if (vehiclesResponse.error) throw new Error(vehiclesResponse.error.message);

    return NextResponse.json({
      addresses: addressesResponse.data,
      statusCounts: statusCountsResponse.data,
      vehicles: vehiclesResponse.data,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export const GET = withClientAuth(bulkCollectionInfoHandler);

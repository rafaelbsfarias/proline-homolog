import { NextResponse } from 'next/server';
import { withAdminAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { getLogger, ILogger } from '@/modules/logger';

const logger: ILogger = getLogger('AdminCollectionRequestsAPI');

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getCollectionRequestsHandler(req: AuthenticatedRequest, context: any) {
  const { clientId } = context.params;
  const adminUser = req.user;
  logger.info(
    `Handler started by admin: ${adminUser?.email} (${adminUser?.id}) to fetch collection requests for client ${clientId}`
  );

  try {
    const supabase = SupabaseService.getInstance().getAdminClient();

    // Query vehicle_collections to get addresses and count of vehicles per address
    // This assumes the vehicle_collections table and collection_id in vehicles table exist.
    const { data, error } = await supabase
      .from('vehicle_collections')
      .select(
        `
        id,
        collection_address,
        collection_fee_per_vehicle,
        status,
        vehicles(id)
      `
      )
      .eq('client_id', clientId)
      .eq('status', 'requested'); // Only show 'requested' collections for now

    if (error) {
      logger.error(`Error fetching collection requests for client ${clientId}:`, error);
      return NextResponse.json(
        { error: `Erro ao buscar solicitações de coleta: ${error.message}` },
        { status: 500 }
      );
    }

    const formattedData = data.map((collection: any) => ({
      id: collection.id,
      address: collection.collection_address,
      vehicle_count: collection.vehicles.length, // Count vehicles linked to this collection
      current_fee: collection.collection_fee_per_vehicle,
      status: collection.status,
    }));

    logger.info(`Found ${formattedData.length} collection requests for client ${clientId}.`);
    return NextResponse.json({ success: true, collectionRequests: formattedData });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Internal server error in getCollectionRequestsHandler:', errorMessage, error);
    return NextResponse.json(
      {
        error: 'Erro interno do servidor',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}

export const GET = withAdminAuth(getCollectionRequestsHandler);

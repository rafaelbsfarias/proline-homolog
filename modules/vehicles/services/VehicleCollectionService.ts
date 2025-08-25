import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { getLogger } from '@/modules/logger';
import type { VehicleItem, AddressItem } from '@/modules/client/types';

const logger = getLogger('VehicleCollectionService');

// Helper function to format address labels, can be moved to a shared util if needed elsewhere
const formatAddressLabel = (a: any) =>
  `${a?.street || ''}${a?.number ? ', ' + a.number : ''}${a?.city ? ' - ' + a.city : ''}`.trim();

/**
 * Fetches a comprehensive summary of vehicle collections for a given client.
 * This function is intended to be called from secured API routes (admin or client).
 * @param clientId The UUID of the client.
 * @returns An object containing groups of vehicles awaiting collection definition, and groups awaiting approval.
 */
export async function getCollectionSummary(clientId: string) {
  const admin = SupabaseService.getInstance().getAdminClient();

  // 1. Fetch vehicles awaiting collection definition ('PONTO DE COLETA SELECIONADO')
  const { data: vehiclesForDef, error: vehDefErr } = (await admin
    .from('vehicles')
    .select('id, client_id, status, pickup_address_id')
    .eq('client_id', clientId)
    .eq('status', 'PONTO DE COLETA SELECIONADO')
    .not('pickup_address_id', 'is', null)) as { data: VehicleItem[] | null; error: any };

  if (vehDefErr) {
    logger.error('error-fetching-vehicles-for-definition', { error: vehDefErr.message, clientId });
    throw new Error('Erro ao buscar veículos para definição de coleta.');
  }

  // 2. Fetch vehicles awaiting client approval ('AGUARDANDO APROVAÇÃO DA COLETA')
  const { data: vehiclesForApproval, error: vehApprErr } = (await admin
    .from('vehicles')
    .select('id, client_id, status, pickup_address_id, estimated_arrival_date')
    .eq('client_id', clientId)
    .eq('status', 'AGUARDANDO APROVAÇÃO DA COLETA')
    .not('pickup_address_id', 'is', null)) as { data: VehicleItem[] | null; error: any };

  if (vehApprErr) {
    logger.error('error-fetching-vehicles-for-approval', { error: vehApprErr.message, clientId });
    throw new Error('Erro ao buscar veículos para aprovação.');
  }

  // 3. Aggregate all unique address IDs from both groups
  const allAddressIds = [
    ...new Set([
      ...(vehiclesForDef || []).map((v: VehicleItem) => v.pickup_address_id),
      ...(vehiclesForApproval || []).map((v: VehicleItem) => v.pickup_address_id),
    ]),
  ].filter(Boolean) as string[];

  if (allAddressIds.length === 0) {
    return { groups: [], approvalGroups: [], approvalTotal: 0 };
  }

  // 4. Fetch details for all unique addresses in one go
  const { data: addresses, error: addrErr } = await admin
    .from('addresses')
    .select('id, street, number, city')
    .in('id', allAddressIds);

  if (addrErr) {
    logger.error('error-fetching-addresses', { error: addrErr.message, clientId });
    throw new Error('Erro ao buscar endereços.');
  }

  const addressLabelMap = new Map<string, string>();
  (addresses || []).forEach((a: AddressItem) => addressLabelMap.set(a.id, formatAddressLabel(a)));

  // 5. Fetch all relevant collection fees for the client in one go
  const { data: feeRows, error: feeErr } = (await admin
    .from('vehicle_collections')
    .select('collection_address, collection_fee_per_vehicle')
    .eq('client_id', clientId)
    .eq('status', 'requested')) as {
    data: { collection_address: string; collection_fee_per_vehicle: number }[] | null;
    error: any;
  };

  if (feeErr) {
    logger.warn('error-loading-fees', { error: feeErr.message, clientId });
  }

  const feeByLabel = new Map<string, number>();
  (feeRows || []).forEach(
    (r: { collection_address: string; collection_fee_per_vehicle: number }) => {
      if (r.collection_address && typeof r.collection_fee_per_vehicle === 'number') {
        feeByLabel.set(r.collection_address, r.collection_fee_per_vehicle);
      }
    }
  );

  // 6. Process and build the final groups

  // Group for admins to DEFINE collection
  const vehiclesByAddressDef = new Map<string, number>();
  (vehiclesForDef || []).forEach(v => {
    if (v.pickup_address_id) {
      vehiclesByAddressDef.set(
        v.pickup_address_id,
        (vehiclesByAddressDef.get(v.pickup_address_id) || 0) + 1
      );
    }
  });

  const groups = Array.from(vehiclesByAddressDef.entries()).map(([addressId, count]) => {
    const label = addressLabelMap.get(addressId) || '';
    return {
      addressId,
      address: label,
      vehicle_count: count,
      collection_fee: feeByLabel.get(label) ?? null,
    };
  });

  // Group for admins/clients to SEE pending approval
  let approvalTotal = 0;
  const vehiclesByAddressApproval = new Map<string, any[]>(); // Store actual vehicles
  (vehiclesForApproval || []).forEach(v => {
    const addressId = v.pickup_address_id;
    if (addressId) {
      if (!vehiclesByAddressApproval.has(addressId)) {
        vehiclesByAddressApproval.set(addressId, []);
      }
      vehiclesByAddressApproval.get(addressId)?.push(v); // Push the whole vehicle object
    }
  });

  const approvalGroups = Array.from(vehiclesByAddressApproval.entries()).map(
    ([addressId, vehicles]) => {
      const label = addressLabelMap.get(addressId) || '';
      const fee = feeByLabel.get(label) ?? null;

      // Calculate total for this address group
      const count = vehicles.length;
      if (typeof fee === 'number') {
        approvalTotal += fee * count;
      }

      return {
        addressId,
        address: label,
        collection_fee: fee, // Fee per vehicle for this address
        vehicles: vehicles.map(v => ({
          // Return individual vehicles with their dates
          id: v.id,
          plate: v.plate,
          status: v.status,
          estimated_arrival_date: v.estimated_arrival_date,
          // Add other relevant vehicle fields if needed by frontend
        })),
      };
    }
  );

  return { groups, approvalGroups, approvalTotal };
}

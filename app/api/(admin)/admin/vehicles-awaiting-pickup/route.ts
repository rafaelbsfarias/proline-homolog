import { NextResponse } from 'next/server';
import { withAdminAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { validateUUID } from '@/modules/common/utils/inputSanitization';
import { getLogger } from '@/modules/logger';

const logger = getLogger('api:admin:vehicles-awaiting-pickup');

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const GET = withAdminAuth(async (req: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get('clientId');

    if (!clientId || !validateUUID(clientId)) {
      return NextResponse.json({ success: false, error: 'clientId inválido' }, { status: 400 });
    }

    const supabase = SupabaseService.getInstance().getAdminClient();

    // Buscar TODAS as solicitações (retirada E entrega) do cliente em estado relevante
    const { data: allRequests, error: requestsError } = await supabase
      .from('delivery_requests')
      .select('id, vehicle_id, desired_date, created_by, status, address_id, fee_amount')
      .eq('client_id', clientId)
      .in('status', ['requested', 'approved', 'scheduled'])
      .order('created_at', { ascending: false });

    if (requestsError) {
      logger.error('fetch_requests_error', { error: requestsError.message, clientId });
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar solicitações' },
        { status: 500 }
      );
    }

    if (!allRequests || allRequests.length === 0) {
      return NextResponse.json({ success: true, pickups: [], deliveries: [] });
    }

    const vehicleIds = allRequests.map(r => r.vehicle_id);
    const addressIds = allRequests.filter(r => r.address_id).map(r => r.address_id);

    // Buscar dados dos veículos correspondentes
    const { data: vehicles, error: vehiclesError } = await supabase
      .from('vehicles')
      .select('id, plate, brand, model, year')
      .in('id', vehicleIds);

    if (vehiclesError) {
      logger.error('fetch_vehicles_error', { error: vehiclesError.message, clientId });
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar veículos' },
        { status: 500 }
      );
    }

    // Buscar endereços das entregas
    let addresses: Array<{
      id: string;
      street?: string;
      number?: string;
      complement?: string;
      neighborhood?: string;
      city?: string;
      state?: string;
      zip_code?: string;
    }> = [];

    // Mapa de valores anteriores por endereço
    const previousFeesByAddress = new Map<string, number>();

    if (addressIds.length > 0) {
      logger.info('fetching_addresses', { addressIds, count: addressIds.length });

      const { data: addressData, error: addressError } = await supabase
        .from('addresses')
        .select('id, street, number, complement, neighborhood, city, state, zip_code')
        .in('id', addressIds);

      if (addressError) {
        logger.warn('fetch_addresses_error', { error: addressError.message });
      } else {
        addresses = addressData || [];
        logger.info('addresses_fetched', { count: addresses.length, addresses });
      }

      // Buscar valores já precificados anteriormente para esses endereços
      // 1. Primeiro, tentar buscar de delivery_requests anteriores
      const { data: previousRequests, error: previousError } = await supabase
        .from('delivery_requests')
        .select('address_id, fee_amount')
        .eq('client_id', clientId)
        .in('address_id', addressIds)
        .not('fee_amount', 'is', null)
        .order('updated_at', { ascending: false });

      if (!previousError && previousRequests) {
        previousRequests.forEach(req => {
          if (
            req.address_id &&
            req.fee_amount !== null &&
            !previousFeesByAddress.has(req.address_id)
          ) {
            previousFeesByAddress.set(req.address_id, req.fee_amount);
          }
        });
      }

      // 2. Buscar também valores de coletas finalizadas no collection_history
      // Aqui precisamos mapear por endereço textual, pois collection_history armazena o endereço como string
      const { data: collectionHistory, error: historyError } = await supabase
        .from('collection_history')
        .select('collection_address, collection_fee_per_vehicle')
        .eq('client_id', clientId)
        .not('collection_fee_per_vehicle', 'is', null)
        .order('finalized_at', { ascending: false });

      if (!historyError && collectionHistory && addresses.length > 0) {
        // Função para normalizar endereços (remover pontuação e espaços extras)
        const normalizeAddress = (addr: string) => {
          return addr
            .toLowerCase()
            .replace(/[,\-.]/g, ' ') // Substituir pontuação por espaço
            .replace(/\s+/g, ' ') // Remover espaços múltiplos
            .trim();
        };

        // Para cada endereço, tentar encontrar correspondência no histórico de coletas
        addresses.forEach(address => {
          const addressParts = [address.street, address.number, address.city].filter(Boolean);

          // Buscar coleta com endereço similar
          const matchingCollection = collectionHistory.find(ch => {
            const chNormalized = normalizeAddress(ch.collection_address || '');

            // Verificar se contém todas as partes principais do endereço
            return addressParts.every(part =>
              chNormalized.includes(normalizeAddress(String(part)))
            );
          });

          if (matchingCollection && !previousFeesByAddress.has(address.id)) {
            previousFeesByAddress.set(address.id, matchingCollection.collection_fee_per_vehicle);
          }
        });
      }

      logger.info('previous_fees_found', {
        addressCount: previousFeesByAddress.size,
        fees: Array.from(previousFeesByAddress.entries()),
      });
    } else {
      logger.info('no_addresses_to_fetch', { addressIds });
    }

    // Separar retiradas e entregas
    const pickupRequests = allRequests.filter(r => r.address_id === null);
    const deliveryRequests = allRequests.filter(r => r.address_id !== null);

    // Auto-persistir valores do histórico no banco de dados
    const deliveriesNeedingFeeUpdate: Array<{ id: string; addressId: string; fee: number }> = [];

    deliveryRequests.forEach(req => {
      if (req.address_id && (req.fee_amount === null || req.fee_amount === undefined)) {
        const previousFee = previousFeesByAddress.get(req.address_id);
        if (previousFee !== undefined && previousFee > 0) {
          deliveriesNeedingFeeUpdate.push({
            id: req.id,
            addressId: req.address_id,
            fee: previousFee,
          });
        }
      }
    });

    // Persistir os valores automaticamente
    if (deliveriesNeedingFeeUpdate.length > 0) {
      logger.info('auto_updating_fees', { count: deliveriesNeedingFeeUpdate.length });

      const updatePromises = deliveriesNeedingFeeUpdate.map(async ({ id, fee }) => {
        const { error } = await supabase
          .from('delivery_requests')
          .update({ fee_amount: fee })
          .eq('id', id);

        if (error) {
          logger.error('auto_update_fee_error', { requestId: id, error: error.message });
        } else {
          logger.info('auto_updated_fee', { requestId: id, fee });
        }
      });

      await Promise.all(updatePromises);
    }

    const mapRequestToVehicle = (req: (typeof allRequests)[0]) => {
      const vehicle = vehicles?.find(v => v.id === req.vehicle_id);
      const address = req.address_id ? addresses.find(a => a.id === req.address_id) : null;

      let addressLabel = '';
      if (address) {
        // Montar o label do endereço a partir das partes
        const parts = [address.street, address.number, address.neighborhood, address.city].filter(
          Boolean
        );
        addressLabel = parts.join(', ');
      }

      // Se a entrega não tem valor definido, usar o valor anterior para aquele endereço
      let feeAmount = req.fee_amount;
      if (req.address_id && (feeAmount === null || feeAmount === undefined)) {
        const previousFee = previousFeesByAddress.get(req.address_id);
        if (previousFee !== undefined) {
          feeAmount = previousFee;
        }
      }

      logger.info('mapping_request', {
        requestId: req.id,
        addressId: req.address_id,
        addressFound: !!address,
        addressLabel,
        originalFee: req.fee_amount,
        finalFee: feeAmount,
      });

      return {
        requestId: req.id,
        requestStatus: req.status,
        vehicleId: req.vehicle_id,
        plate: vehicle?.plate || '-',
        brand: vehicle?.brand || '-',
        model: vehicle?.model || '-',
        year: vehicle?.year ? String(vehicle.year) : undefined,
        requestedDate: req.desired_date || null,
        proposedBy: req.created_by === clientId ? ('client' as const) : ('admin' as const),
        type: req.address_id === null ? ('pickup' as const) : ('delivery' as const),
        addressId: req.address_id,
        addressLabel,
        feeAmount,
      };
    };

    const pickups = pickupRequests.map(mapRequestToVehicle);
    const deliveries = deliveryRequests.map(mapRequestToVehicle);

    return NextResponse.json({ success: true, pickups, deliveries });
  } catch (e: unknown) {
    const err = e as Error;
    logger.error('unexpected_error', { error: err?.message });
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
});

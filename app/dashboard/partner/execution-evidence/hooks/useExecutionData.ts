import { useState, useEffect } from 'react';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';
import { getLogger } from '@/modules/logger';
import { ServiceWithEvidences, VehicleInfo, Evidence } from '../types';

const logger = getLogger('partner:execution-evidence');

export const useExecutionData = (quoteId: string | null) => {
  const { get } = useAuthenticatedFetch();
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<ServiceWithEvidences[]>([]);
  const [vehicleInfo, setVehicleInfo] = useState<VehicleInfo>({
    plate: '',
    brand: '',
    model: '',
  });

  const loadData = async () => {
    if (!quoteId) return;

    try {
      setLoading(true);
      logger.info('load_service_order_start', { quoteId });

      const resp = await get(`/api/partner/service-order/${quoteId}`, { requireAuth: true });

      if (!resp.ok) {
        logger.error('load_service_order_failed', { status: resp.status, quoteId });
        return { error: resp.error || 'Falha ao carregar ordem de serviço' };
      }

      interface ServiceOrderResponse {
        serviceOrder?: {
          vehicle?: { plate: string; brand: string; model: string };
          items?: Array<{
            id: string;
            description: string;
            quantity: number;
            unit_price: number;
            total_price: number;
            started_at?: string | null;
            completed_at?: string | null;
          }>;
          evidences?: Evidence[];
        };
      }

      const responseData = resp.data as ServiceOrderResponse;
      const serviceOrder = responseData?.serviceOrder;

      if (!serviceOrder) {
        logger.info('no_items_in_service_order');
        return { error: 'Nenhum serviço encontrado neste orçamento' };
      }

      // Processar veículo
      setVehicleInfo({
        plate: serviceOrder.vehicle?.plate || '',
        brand: serviceOrder.vehicle?.brand || '',
        model: serviceOrder.vehicle?.model || '',
      });

      // Processar evidências
      const items = serviceOrder.items || [];
      const existingEvidences = serviceOrder.evidences || [];

      const evidencesByItem = new Map<string, Evidence[]>();
      existingEvidences.forEach((ev: Evidence) => {
        if (!evidencesByItem.has(ev.quote_item_id)) {
          evidencesByItem.set(ev.quote_item_id, []);
        }
        evidencesByItem.get(ev.quote_item_id)!.push(ev);
      });

      // Combinar dados
      const servicesWithEvidences: ServiceWithEvidences[] = items.map(item => ({
        id: item.id,
        description: item.description || '',
        quantity: item.quantity || 0,
        unit_price: Number(item.unit_price ?? 0),
        total_price: Number(item.total_price ?? 0),
        started_at: item.started_at,
        completed_at: item.completed_at,
        evidences: evidencesByItem.get(item.id) || [],
      }));

      setServices(servicesWithEvidences);
      logger.info('services_ready', { count: servicesWithEvidences.length });

      return { success: true };
    } catch (e) {
      logger.error('load_quote_data_error', { error: e instanceof Error ? e.message : String(e) });
      return { error: 'Erro ao carregar dados do orçamento' };
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [quoteId]);

  return {
    loading,
    services,
    vehicleInfo,
    setServices,
    reloadData: loadData,
  };
};

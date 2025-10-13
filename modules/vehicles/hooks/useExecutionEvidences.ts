import { useState, useEffect } from 'react';
import { supabase } from '@/modules/common/services/supabaseClient';
import { getLogger } from '@/modules/logger';

const logger = getLogger('hooks:useExecutionEvidences');

interface ExecutionEvidence {
  id: string;
  quote_item_id: string;
  image_url: string;
  description: string | null;
  uploaded_at: string;
  quote_items: {
    description: string;
    completed_at: string | null;
  };
}

interface GroupedEvidence {
  serviceName: string;
  completed: boolean;
  completedAt: string | null;
  evidences: Array<{
    id: string;
    image_url: string;
    description: string | null;
    uploaded_at: string;
  }>;
}

export function useExecutionEvidences(vehicleId: string | undefined) {
  const [evidences, setEvidences] = useState<GroupedEvidence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!vehicleId) {
      setLoading(false);
      return;
    }

    const fetchEvidences = async () => {
      try {
        setLoading(true);
        setError(null);

        logger.info('fetch_execution_evidences_start', { vehicleId });

        // 1. Buscar service_order associado ao veículo
        const { data: serviceOrders, error: soError } = await supabase
          .from('service_orders')
          .select('id')
          .eq('vehicle_id', vehicleId)
          .order('created_at', { ascending: false });

        if (soError) {
          logger.error('fetch_service_orders_error', { error: soError });
          throw soError;
        }

        if (!serviceOrders || serviceOrders.length === 0) {
          logger.info('no_service_orders_found', { vehicleId });
          setEvidences([]);
          setLoading(false);
          return;
        }

        // 2. Buscar quotes associadas aos service_orders
        const serviceOrderIds = serviceOrders.map(so => so.id);
        const { data: quotes, error: quotesError } = await supabase
          .from('quotes')
          .select('id')
          .in('service_order_id', serviceOrderIds);

        if (quotesError) {
          logger.error('fetch_quotes_error', { error: quotesError });
          throw quotesError;
        }

        if (!quotes || quotes.length === 0) {
          logger.info('no_quotes_found', { vehicleId });
          setEvidences([]);
          setLoading(false);
          return;
        }

        const quoteIds = quotes.map(q => q.id);
        logger.info('quotes_found', { quoteIds, count: quoteIds.length });

        // 3. Buscar evidências de execução com informações dos itens
        const { data: executionEvidences, error: evidencesError } = await supabase
          .from('execution_evidences')
          .select(
            `
            id,
            quote_item_id,
            image_url,
            description,
            uploaded_at,
            quote_items!inner(
              description,
              completed_at
            )
          `
          )
          .in('quote_id', quoteIds)
          .order('uploaded_at', { ascending: true });

        if (evidencesError) {
          logger.error('fetch_execution_evidences_error', { error: evidencesError });
          throw evidencesError;
        }

        logger.info('execution_evidences_loaded', { count: executionEvidences?.length || 0 });

        // 4. Agrupar evidências por serviço
        const groupedMap = new Map<string, GroupedEvidence>();

        executionEvidences?.forEach((ev: ExecutionEvidence) => {
          const quoteItem = ev.quote_items as unknown as {
            description: string;
            completed_at: string | null;
          };
          const serviceId = ev.quote_item_id;

          if (!groupedMap.has(serviceId)) {
            groupedMap.set(serviceId, {
              serviceName: quoteItem.description,
              completed: !!quoteItem.completed_at,
              completedAt: quoteItem.completed_at,
              evidences: [],
            });
          }

          groupedMap.get(serviceId)!.evidences.push({
            id: ev.id,
            image_url: ev.image_url,
            description: ev.description,
            uploaded_at: ev.uploaded_at,
          });
        });

        const grouped = Array.from(groupedMap.values());
        logger.info('evidences_grouped', { services: grouped.length });

        setEvidences(grouped);
      } catch (err) {
        logger.error('fetch_execution_evidences_failed', {
          error: err instanceof Error ? err.message : String(err),
        });
        setError('Erro ao carregar evidências de execução');
      } finally {
        setLoading(false);
      }
    };

    fetchEvidences();
  }, [vehicleId]);

  return { evidences, loading, error };
}

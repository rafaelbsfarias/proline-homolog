import { useState } from 'react';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';
import { getLogger } from '@/modules/logger';

const logger = getLogger('partner:service-start');

export const useServiceStart = (quoteId: string | null) => {
  const { post } = useAuthenticatedFetch();
  const [starting, setStarting] = useState(false);

  const startService = async (serviceId: string, serviceName: string) => {
    try {
      setStarting(true);
      logger.info('start_service_request', { serviceId, serviceName });

      const response = await post(
        '/api/partner/start-service',
        { quote_id: quoteId, quote_item_id: serviceId },
        { requireAuth: true }
      );

      const responseData = response.data as {
        ok?: boolean;
        error?: string;
        message?: string;
      } | null;

      if (!response.ok || !responseData?.ok) {
        const error = response.error || responseData?.error || 'Erro ao iniciar serviço';
        logger.error('start_service_api_error', { status: response.status, error });
        return { success: false, error };
      }

      const message = responseData?.message || `✅ Execução de "${serviceName}" iniciada`;

      logger.info('start_service_success', { serviceId });

      return { success: true, message };
    } catch (e) {
      logger.error('start_service_error', { error: e instanceof Error ? e.message : String(e) });
      return { success: false, error: 'Erro ao iniciar serviço' };
    } finally {
      setStarting(false);
    }
  };

  return { starting, startService };
};

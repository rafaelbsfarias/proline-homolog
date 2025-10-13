import { useState } from 'react';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';
import { getLogger } from '@/modules/logger';

const logger = getLogger('partner:service-completion');

export const useServiceCompletion = (quoteId: string | null) => {
  const { post } = useAuthenticatedFetch();
  const [completing, setCompleting] = useState(false);

  const completeService = async (serviceId: string, serviceName: string) => {
    try {
      setCompleting(true);
      logger.info('complete_service_start', { serviceId, serviceName });

      const response = await post(
        '/api/partner/complete-service',
        { quote_id: quoteId, quote_item_id: serviceId },
        { requireAuth: true }
      );

      const responseData = response.data as {
        ok?: boolean;
        error?: string;
        all_services_completed?: boolean;
      } | null;

      if (!response.ok || !responseData?.ok) {
        const error =
          response.error || responseData?.error || 'Erro ao marcar serviço como concluído';
        logger.error('complete_service_api_error', { status: response.status, error });
        return { success: false, error };
      }

      const message = responseData?.all_services_completed
        ? '✅ Serviço concluído! Todos os serviços foram finalizados.'
        : `✅ Serviço "${serviceName}" marcado como concluído`;

      logger.info('complete_service_success', {
        serviceId,
        all_completed: responseData?.all_services_completed,
      });

      return { success: true, message };
    } catch (e) {
      logger.error('complete_service_error', { error: e instanceof Error ? e.message : String(e) });
      return { success: false, error: 'Erro ao marcar serviço como concluído' };
    } finally {
      setCompleting(false);
    }
  };

  return { completing, completeService };
};

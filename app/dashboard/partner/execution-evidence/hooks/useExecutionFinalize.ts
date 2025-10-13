import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';
import { getLogger } from '@/modules/logger';
import { ServiceWithEvidences } from '../types';
import { validateCanFinalize, getValidationMessage } from '../utils/validations';

const logger = getLogger('partner:execution-finalize');

export const useExecutionFinalize = (quoteId: string | null) => {
  const router = useRouter();
  const { post } = useAuthenticatedFetch();
  const [finalizing, setFinalizing] = useState(false);

  const saveEvidences = async (services: ServiceWithEvidences[]) => {
    const allEvidences = services.flatMap(service =>
      service.evidences.map(ev => ({
        quote_item_id: service.id,
        image_url: ev.image_url,
        description: ev.description || null,
      }))
    );

    logger.info('save_evidences_prepared', { count: allEvidences.length });

    const response = await post(
      '/api/partner/execution-evidences',
      { quote_id: quoteId, evidences: allEvidences },
      { requireAuth: true }
    );

    const responseData = response.data as {
      ok?: boolean;
      error?: string;
      inserted?: number;
    } | null;

    if (!response.ok || !responseData?.ok) {
      throw new Error(response.error || responseData?.error || 'Erro ao salvar evidências');
    }

    logger.info('save_evidences_success', { inserted: responseData?.inserted });
  };

  const finalize = async (services: ServiceWithEvidences[]) => {
    try {
      setFinalizing(true);
      logger.info('finalize_execution_start');

      // Validar
      const { canFinalize, servicesWithoutEvidences, servicesNotCompleted } =
        validateCanFinalize(services);

      if (!canFinalize) {
        const message = getValidationMessage(servicesWithoutEvidences, servicesNotCompleted);
        logger.warn('finalize_blocked', {
          servicesWithoutEvidences: servicesWithoutEvidences.length,
        });
        return { success: false, error: message };
      }

      // Salvar evidências
      await saveEvidences(services);

      // Finalizar execução
      const response = await post(
        '/api/partner/finalize-execution',
        { quote_id: quoteId },
        { requireAuth: true }
      );

      const responseData = response.data as {
        ok?: boolean;
        error?: string;
        completed_at?: string;
        vehicle_status?: string;
      } | null;

      if (!response.ok || !responseData?.ok) {
        throw new Error(response.error || responseData?.error || 'Erro ao finalizar execução');
      }

      logger.info('finalize_execution_success', {
        completed_at: responseData?.completed_at,
        vehicle_status: responseData?.vehicle_status,
      });

      setTimeout(() => router.push('/dashboard'), 2000);

      return {
        success: true,
        message: '✅ Execução finalizada com sucesso! Veículo marcado como "Execução Finalizada"',
      };
    } catch (e) {
      logger.error('finalize_execution_error', {
        error: e instanceof Error ? e.message : String(e),
      });
      return {
        success: false,
        error: e instanceof Error ? e.message : 'Erro ao finalizar execução',
      };
    } finally {
      setFinalizing(false);
    }
  };

  const saveProgress = async (services: ServiceWithEvidences[]) => {
    try {
      setFinalizing(true);
      await saveEvidences(services);
      return { success: true, message: 'Evidências salvas com sucesso' };
    } catch (e) {
      logger.error('save_progress_error', { error: e instanceof Error ? e.message : String(e) });
      return {
        success: false,
        error: e instanceof Error ? e.message : 'Erro ao salvar evidências',
      };
    } finally {
      setFinalizing(false);
    }
  };

  return { finalizing, finalize, saveProgress };
};

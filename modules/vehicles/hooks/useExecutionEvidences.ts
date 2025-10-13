import { useState, useEffect } from 'react';
import { getLogger } from '@/modules/logger';

const logger = getLogger('hooks:useExecutionEvidences');

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

        // Usar API que bypassa RLS
        const response = await fetch(`/api/vehicle-execution-evidences?vehicleId=${vehicleId}`);

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();

        if (!data.ok) {
          throw new Error(data.error || 'Erro ao buscar evidências');
        }

        logger.info('execution_evidences_loaded', { count: data.evidences?.length || 0 });
        setEvidences(data.evidences || []);
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

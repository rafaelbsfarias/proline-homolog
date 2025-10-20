'use client';

import { useState, useEffect } from 'react';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';
import { getLogger, ILogger } from '@/modules/logger';

const logger: ILogger = getLogger('usePendingRegistrationsHook');

export interface PendingRegistration {
  id: string;
  email: string;
  full_name: string | null;
  user_role: string;
  created_at: string;
  company_name?: string | null;
  cnpj?: string | null;
  phone?: string | null;
}

export function usePendingRegistrations() {
  const [pendingRegistrations, setPendingRegistrations] = useState<PendingRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { get } = useAuthenticatedFetch();

  const fetchPendingRegistrations = async () => {
    logger.info('Fetching pending registrations...');
    try {
      setLoading(true);
      setError(null);

      const response = await get<PendingRegistration[]>('/api/admin/cadastros-pendentes');

      if (!response.ok) {
        const errorMessage = response.error || 'Erro ao buscar cadastros pendentes';
        logger.error('Failed to fetch pending registrations:', errorMessage);
        throw new Error(errorMessage);
      }

      setPendingRegistrations(response.data || []);
      logger.info(`Successfully fetched ${response.data?.length || 0} pending registrations.`);
      logger.debug('Fetched data:', response.data);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      logger.error('Error during fetchPendingRegistrations:', errorMessage, err);
      setError(errorMessage);
      setPendingRegistrations([]);
    } finally {
      setLoading(false);
      logger.info('Finished fetching pending registrations.');
    }
  };

  useEffect(() => {
    logger.info('useEffect triggered: Initial fetch of pending registrations.');
    fetchPendingRegistrations();
  }, []);

  return {
    pendingRegistrations,
    loading,
    error,
    refetch: fetchPendingRegistrations,
  };
}

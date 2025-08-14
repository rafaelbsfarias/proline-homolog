'use client';
import { useState, useEffect, useCallback } from 'react';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetchDebug'; // This hook itself might have debug logs
import { getLogger, ILogger } from '@/modules/logger';

const logger: ILogger = getLogger('usePendingRegistrationsDebugHook');

export interface PendingRegistration {
  id: string;
  email: string;
  user_metadata: {
    name?: string;
    role?: string;
    user_type?: string;
  };
  created_at: string;
  email_confirmed_at?: string;
}

export const usePendingRegistrationsDebug = () => {
  const [pendingRegistrations, setPendingRegistrations] = useState<PendingRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { get } = useAuthenticatedFetch();

  const fetchPendingRegistrations = useCallback(async () => {
    logger.debug('Initiating fetchPendingRegistrations...');

    try {
      setLoading(true);
      setError(null);

      logger.debug('Making request with debug active...');

      const response = await get<{ users: PendingRegistration[] }>('/api/admin/list-users', {
        debug: true,
      });

      logger.debug('Response received:', response);

      if (response.ok && response.data) {
        logger.debug('API data:', response.data);

        const pending = response.data.users.filter(user => !user.email_confirmed_at);

        logger.debug('Filtered pending users:', pending);

        setPendingRegistrations(pending);
      } else {
        logger.error('Error in response:', response.error);
        setError(response.error || 'Erro ao carregar registros pendentes');
      }
    } catch (err: unknown) {
      logger.error('Exception caught:', err);
      setError('Erro ao conectar com o servidor');
    } finally {
      setLoading(false);
    }
  }, [get]);

  useEffect(() => {
    logger.debug('useEffect executed, calling fetchPendingRegistrations...');
    fetchPendingRegistrations();
  }, [fetchPendingRegistrations]);

  const refreshPendingRegistrations = useCallback(() => {
    logger.debug('Refreshing pending registrations.');
    fetchPendingRegistrations();
  }, [fetchPendingRegistrations]);

  return {
    registrations: pendingRegistrations,
    loading,
    error,
    refetch: refreshPendingRegistrations,
  };
};

'use client';
import { useState, useEffect, useCallback } from 'react';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';
import { getLogger, ILogger } from '@/modules/logger';

const logger: ILogger = getLogger('useUserListHook');

// Função utilitária para traduzir perfis para português
export function translateRole(role?: string) {
  if (!role) return '';
  switch (role) {
    case 'admin':
      return 'Administrador';
    case 'partner':
      return 'Parceiro';
    case 'client':
      return 'Cliente';
    case 'user':
      return 'Usuário';
    case 'specialist':
      return 'Especialista';
    default:
      return role;
  }
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: string; // Mudança: era 'role' na interface mas API retorna 'user_role'
  user_role?: string; // Adicionar compatibilidade
  status?: string;
  user_metadata?: {
    name?: string;
    role?: string;
  };
  created_at: string;
  email_confirmed_at?: string;
}

export const useUserList = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('');
  const { get } = useAuthenticatedFetch();

  const fetchUsers = useCallback(async () => {
    logger.info('Fetching user list...');
    try {
      setLoading(true);
      setError(null);

      const response = await get<unknown>('/api/admin/list-users');

      if (response.ok && response.data) {
        const payload = response.data as any;
        const rawUsers: any[] = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.users)
            ? payload.users
            : [];

        const normalizedUsers = rawUsers.map((user: any) => ({
          id: user.id,
          email: user.email,
          full_name: user.full_name ?? user.user_metadata?.full_name ?? '',
          role: user.user_role || user.role || user.user_metadata?.role || 'client',
          status: user.status,
          created_at: user.created_at ?? '',
        }));

        setUsers(normalizedUsers);
        logger.info(`Successfully loaded ${normalizedUsers.length} users.`);
        logger.debug('First user:', normalizedUsers[0]);
      } else {
        const errorMessage = response.error || 'Erro ao carregar usuários';
        logger.error('Failed to load users:', errorMessage);
        setError(errorMessage);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      logger.error('Error during fetchUsers:', errorMessage, err);
      setError('Erro ao conectar com o servidor');
    } finally {
      setLoading(false);
      logger.info('Finished fetching user list.');
    }
  }, [get]);

  useEffect(() => {
    logger.info('useEffect triggered: Initial fetch of user list.');
    fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = users.filter(user => {
    if (!filter) return true;

    const filterLower = filter.toLowerCase();
    const userName = user.full_name || user.user_metadata?.name || '';
    const userRole = user.role || user.user_metadata?.role || '';

    return (
      userName.toLowerCase().includes(filterLower) ||
      user.email.toLowerCase().includes(filterLower) ||
      userRole.toLowerCase().includes(filterLower) ||
      translateRole(userRole).toLowerCase().includes(filterLower)
    );
  });

  const refreshUsers = useCallback(() => {
    logger.info('Refreshing user list.');
    fetchUsers();
  }, [fetchUsers]);

  return {
    users: filteredUsers,
    loading,
    error,
    filter,
    setFilter,
    refetch: refreshUsers,
  };
};

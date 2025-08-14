'use client';
import { useState, useEffect } from 'react';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';
import { getLogger, ILogger } from '@/modules/logger';

const logger: ILogger = getLogger('useCadastrosPendentesHook');

export interface CadastroPendente {
  id: string;
  email: string;
  full_name: string;
  role: string;
  status: 'pendente';
  created_at: string;
  email_confirmed_at: string | null;
  source: 'auth_users' | 'pending_registrations';
}

export interface CadastrosPendentesResponse {
  cadastrosPendentes: CadastroPendente[];
  total: number;
  message: string;
}

/**
 * Hook especializado para gerenciar cadastros pendentes de aprovação
 *
 * Utiliza a API otimizada /api/admin/cadastros-pendentes que:
 * - Busca apenas dados necessários (não todos os usuários)
 * - Aplica filtros no backend (mais eficiente)
 * - Retorna dados já processados e sanitizados
 * - Segue princípio de responsabilidade única
 *
 * @returns {object} Estado e funções para gerenciar cadastros pendentes
 */
export function useCadastrosPendentes() {
  const [cadastrosPendentes, setCadastrosPendentes] = useState<CadastroPendente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const { authenticatedFetch } = useAuthenticatedFetch();

  const fetchCadastrosPendentes = async () => {
    logger.info('Fetching pending registrations...');
    try {
      setLoading(true);
      setError(null);

      const response = await authenticatedFetch<CadastrosPendentesResponse>(
        '/api/admin/cadastros-pendentes'
      );

      if (!response.ok || response.error) {
        const errorMessage = response.error || 'Erro ao buscar cadastros pendentes';
        logger.error('Failed to fetch pending registrations:', errorMessage);
        throw new Error(errorMessage);
      }

      if (response.data) {
        setCadastrosPendentes(response.data.cadastrosPendentes || []);
        setTotal(response.data.total || 0);
        logger.info(`Successfully fetched ${response.data.total || 0} pending registrations.`);
        logger.debug('Fetched data:', response.data);
      } else {
        logger.warn('No data received for pending registrations.');
        setCadastrosPendentes([]);
        setTotal(0);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      logger.error('Error during fetchCadastrosPendentes:', errorMessage, err);
      setError(errorMessage);
      setCadastrosPendentes([]);
      setTotal(0);
    } finally {
      setLoading(false);
      logger.info('Finished fetching pending registrations.');
    }
  };

  /**
   * Recarrega a lista de cadastros pendentes
   * Útil após aprovar/rejeitar um cadastro
   */
  const refetch = () => {
    logger.info('Refetching pending registrations.');
    return fetchCadastrosPendentes();
  };

  /**
   * Filtra cadastros por role específica
   */
  const filtrarPorRole = (role: string) => {
    logger.debug(`Filtering pending registrations by role: ${role}`);
    return cadastrosPendentes.filter(
      cadastro => cadastro.role.toLowerCase() === role.toLowerCase()
    );
  };

  /**
   * Filtra cadastros por fonte de dados
   */
  const filtrarPorFonte = (source: 'auth_users' | 'pending_registrations') => {
    logger.debug(`Filtering pending registrations by source: ${source}`);
    return cadastrosPendentes.filter(cadastro => cadastro.source === source);
  };

  /**
   * Busca cadastro por email
   */
  const buscarPorEmail = (email: string) => {
    logger.debug(`Searching pending registrations by email: ${email}`);
    return cadastrosPendentes.find(
      cadastro => cadastro.email.toLowerCase() === email.toLowerCase()
    );
  };

  useEffect(() => {
    logger.info('useEffect triggered: Initial fetch of pending registrations.');
    fetchCadastrosPendentes();
  }, []);

  return {
    // Estado principal
    cadastrosPendentes,
    loading,
    error,
    total,

    // Funções de controle
    refetch,

    // Funções de filtragem e busca
    filtrarPorRole,
    filtrarPorFonte,
    buscarPorEmail,

    // Estados derivados úteis
    isEmpty: total === 0,
    hasData: total > 0,

    // Estatísticas por role
    totalClientes: filtrarPorRole('cliente').length,
    totalParceiros: filtrarPorRole('parceiro').length,
    totalEspecialistas: filtrarPorRole('especialista').length,

    // Estatísticas por fonte
    totalAuthUsers: filtrarPorFonte('auth_users').length,
    totalPendingTable: filtrarPorFonte('pending_registrations').length,
  };
}

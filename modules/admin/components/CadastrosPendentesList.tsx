'use client';

import React, { useState } from 'react';
import { useCadastrosPendentes } from '../hooks/useCadastrosPendentes';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';
import { useToast } from '@/modules/common/components/ToastProvider';

/**
 * Componente otimizado para listagem de cadastros pendentes
 *
 * Utiliza a nova API especializada e hook dedicado para:
 * - Performance superior (busca apenas dados necessários)
 * - Interface mais limpa e responsiva
 * - Funcionalidades avançadas de filtragem
 * - Estatísticas em tempo real
 */
const CadastrosPendentesList: React.FC = () => {
  const { showToast } = useToast();
  const { authenticatedFetch } = useAuthenticatedFetch();

  const {
    cadastrosPendentes,
    loading,
    error,
    total,
    refetch,
    filtrarPorRole,
    isEmpty,
    totalClientes,
    totalParceiros,
    totalEspecialistas,
    totalAuthUsers,
    totalPendingTable,
  } = useCadastrosPendentes();

  // Estados locais para UI
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filtroRole, setFiltroRole] = useState<string>('todos');

  // Função para aprovar cadastro
  const handleApprove = async (userId: string, email: string) => {
    try {
      setActionLoading(userId);

      const response = await authenticatedFetch('/api/admin/approve-registration', {
        method: 'POST',
        body: JSON.stringify({
          userId,
          email,
          action: 'approve',
        }),
      });

      if (response.ok) {
        showToast('success', 'Cadastro aprovado com sucesso!');
        await refetch(); // Recarregar lista
      } else {
        throw new Error(response.error || 'Erro ao aprovar cadastro');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      showToast('error', `Erro ao aprovar: ${errorMessage}`);
    } finally {
      setActionLoading(null);
    }
  };

  // Função para rejeitar cadastro
  const handleReject = async (userId: string, email: string) => {
    try {
      setActionLoading(userId);

      const response = await authenticatedFetch('/api/admin/reject-registration', {
        method: 'POST',
        body: JSON.stringify({
          userId,
          email,
          action: 'reject',
        }),
      });

      if (response.ok) {
        showToast('success', 'Cadastro rejeitado com sucesso!');
        await refetch(); // Recarregar lista
      } else {
        throw new Error(response.error || 'Erro ao rejeitar cadastro');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      showToast('error', `Erro ao rejeitar: ${errorMessage}`);
    } finally {
      setActionLoading(null);
    }
  };

  // Aplicar filtro por role
  const cadastrosFiltrados =
    filtroRole === 'todos' ? cadastrosPendentes : filtrarPorRole(filtroRole);

  // Função para traduzir role
  const translateRole = (role: string): string => {
    const roleMap: { [key: string]: string } = {
      cliente: 'Cliente',
      parceiro: 'Parceiro',
      especialista: 'Especialista',
      admin: 'Administrador',
    };
    return roleMap[role?.toLowerCase()] || role || 'Não definido';
  };

  // Função para obter cor da badge por role
  const getRoleBadgeColor = (role: string): string => {
    const colorMap: { [key: string]: string } = {
      cliente: 'bg-blue-100 text-blue-800',
      parceiro: 'bg-green-100 text-green-800',
      especialista: 'bg-purple-100 text-purple-800',
      admin: 'bg-red-100 text-red-800',
    };
    return colorMap[role?.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Carregando cadastros pendentes...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <div className="text-red-600 font-medium">Erro ao carregar cadastros</div>
        </div>
        <div className="text-red-600 text-sm mt-1">{error}</div>
        <button
          onClick={refetch}
          className="mt-3 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
        >
          Tentar Novamente
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com Estatísticas e Filtros pode ser mantido acima da tabela, se desejado */}
      {/* ...existing code for header/filtros... */}
      {/* Tabela de Cadastros Pendentes */}
      <div className="bg-white rounded-lg shadow-sm border p-0">
        <table className="min-w-full">
          <thead>
            <tr>
              <th className="px-6 py-3 bg-gray-100 text-left text-base font-bold text-black rounded-tl-lg">
                Nome
              </th>
              <th className="px-6 py-3 bg-gray-100 text-left text-base font-bold text-black">
                Email
              </th>
              <th className="px-6 py-3 bg-gray-100 text-left text-base font-bold text-black">
                Perfil
              </th>
              <th className="px-6 py-3 bg-gray-100 text-left text-base font-bold text-black rounded-tr-lg">
                Ações
              </th>
            </tr>
          </thead>
          <tbody>
            {isEmpty ? (
              <tr>
                <td colSpan={4} className="text-center py-8 text-gray-500 text-lg">
                  🎉 Nenhum cadastro pendente encontrado!
                </td>
              </tr>
            ) : (
              cadastrosFiltrados.map(cadastro => (
                <tr key={cadastro.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 align-middle text-base text-black font-normal">
                    {cadastro.full_name || 'Nome não informado'}
                  </td>
                  <td className="px-6 py-4 align-middle text-base text-black font-normal">
                    {cadastro.email}
                  </td>
                  <td className="px-6 py-4 align-middle text-base text-black font-normal">
                    {translateRole(cadastro.role)}
                  </td>
                  <td className="px-6 py-4 align-middle">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(cadastro.id, cadastro.email)}
                        disabled={actionLoading === cadastro.id}
                        className="w-10 h-10 flex items-center justify-center bg-green-600 text-white rounded-lg text-2xl font-bold shadow hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-green-400"
                        title="Aprovar cadastro"
                      >
                        ✓
                      </button>
                      <button
                        onClick={() => handleReject(cadastro.id, cadastro.email)}
                        disabled={actionLoading === cadastro.id}
                        className="w-10 h-10 flex items-center justify-center bg-red-600 text-white rounded-lg text-2xl font-bold shadow hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-red-400"
                        title="Rejeitar cadastro"
                      >
                        ✗
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CadastrosPendentesList;

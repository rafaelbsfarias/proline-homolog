'use client';

import React, { useState } from 'react';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';
import { useRouter } from 'next/navigation';
import { usePendingRegistrations } from '../hooks/usePendingRegistrations';
import { Header } from '.';
import { translateRole } from '../hooks/useUserList';
import ApproveRegistrationModal, { ApproveFields } from './ApproveRegistrationModal';
import ConfirmDialog from './ConfirmDialog';
import { getLogger, ILogger } from '@/modules/logger';

const logger: ILogger = getLogger('PendingRegistrationsList');

const PendingRegistrationsList: React.FC = () => {
  const {
    pendingRegistrations: cadastrosPendentes,
    loading,
    error,
    refetch,
  } = usePendingRegistrations();
  const { authenticatedFetch } = useAuthenticatedFetch();
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{
    id: string;
    full_name: string;
    email: string;
  } | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [rejectingUserId, setRejectingUserId] = useState<string | null>(null);
  const [rejectLoading, setRejectLoading] = useState(false);
  const [rejectError, setRejectError] = useState<string | null>(null);

  const handleApproveClick = (user: any) => {
    logger.info(`Approve click for user: ${user.email} (ID: ${user.id})`);
    setSelectedUser({ id: user.id, full_name: user.full_name, email: user.email });
    setModalOpen(true);
  };
  const handleModalClose = () => {
    logger.info('Approve registration modal closed.');
    setModalOpen(false);
    setSelectedUser(null);
  };

  const handleModalConfirm = async (fields: ApproveFields) => {
    if (!selectedUser) {
      logger.warn('Attempted to confirm approval without a selected user.');
      return;
    }
    logger.info(`Confirming approval for user: ${selectedUser.email} (ID: ${selectedUser.id})`);
    logger.debug('Approval fields:', fields);
    try {
      const response = await authenticatedFetch('/api/admin/approve-registration', {
        method: 'POST',
        body: JSON.stringify({ userId: selectedUser.id, ...fields }),
      });
      if (!response.ok) {
        const errorMessage = response.error || 'Erro ao aprovar cadastro';
        logger.error('Failed to approve registration:', errorMessage);
        throw new Error(errorMessage);
      }
      logger.info(`Registration for user ${selectedUser.id} approved successfully.`);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      logger.error('Error during registration approval:', errorMessage, err);
      // Opcional: feedback de erro
    } finally {
      setModalOpen(false);
      setSelectedUser(null);
      refetch();
      logger.info('Approval process finished, refetching pending registrations.');
    }
  };

  const handleReject = (userId: string) => {
    logger.info(`Reject click for user ID: ${userId}`);
    setRejectingUserId(userId);
    setRejectError(null);
    setConfirmDialogOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!rejectingUserId) {
      logger.warn('Attempted to confirm rejection without a rejecting user ID.');
      return;
    }
    logger.info(`Confirming rejection for user ID: ${rejectingUserId}`);
    setRejectLoading(true);
    setRejectError(null);
    try {
      const response = await authenticatedFetch('/api/admin/reject-registration', {
        method: 'POST',
        body: JSON.stringify({ userId: rejectingUserId }),
      });
      if (!response.ok) {
        const errorMessage = response.error || 'Erro ao recusar cadastro';
        logger.error('Failed to reject registration:', errorMessage);
        throw new Error(errorMessage);
      }
      logger.info(`Registration for user ${rejectingUserId} rejected successfully.`);
      setConfirmDialogOpen(false);
      setRejectingUserId(null);
      refetch();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      logger.error('Error during registration rejection:', errorMessage, err);
      setRejectError('Erro ao recusar cadastro.');
    } finally {
      setRejectLoading(false);
      logger.info('Rejection process finished, refetching pending registrations.');
    }
  };

  logger.debug('Rendering PendingRegistrationsList component.');
  if (loading) {
    logger.info('PendingRegistrationsList: Loading data...');
  }
  if (error) {
    logger.error('PendingRegistrationsList: Error loading data:', error);
  }
  logger.debug(`Pending registrations count: ${cadastrosPendentes.length}`);

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <Header />
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '20px',
        }}
      >
        <div
          style={{
            background: '#fff',
            borderRadius: 8,
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '20px 24px',
              borderBottom: '1px solid #e0e0e0',
              background: '#fff',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <button
                onClick={() => {
                  logger.info('Back button clicked.');
                  router.back();
                }}
                style={{
                  padding: '8px 16px',
                  fontSize: 14,
                  borderRadius: 4,
                  border: 'none',
                  background: '#1a237e',
                  color: '#fff',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
                onMouseOver={e => (e.currentTarget.style.background = '#303f9f')}
                onMouseOut={e => (e.currentTarget.style.background = '#1a237e')}
              >
                ← Voltar
              </button>
              <h2
                style={{
                  margin: 0,
                  fontSize: 24,
                  fontWeight: 600,
                  color: '#333',
                }}
              >
                Cadastros Pendentes
              </h2>
            </div>
          </div>
          {loading && <div style={{ padding: '20px', textAlign: 'center' }}>Carregando...</div>}
          {error && (
            <div style={{ padding: '20px', color: 'red', textAlign: 'center' }}>{error}</div>
          )}

          <div style={{ overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8f9fa' }}>
                  <th
                    style={{
                      textAlign: 'left',
                      padding: '16px 24px',
                      fontSize: 14,
                      fontWeight: 600,
                      color: '#666',
                      borderBottom: '1px solid #e0e0e0',
                    }}
                  >
                    Nome
                  </th>
                  <th
                    style={{
                      textAlign: 'left',
                      padding: '16px 24px',
                      fontSize: 14,
                      fontWeight: 600,
                      color: '#666',
                      borderBottom: '1px solid #e0e0e0',
                    }}
                  >
                    Email
                  </th>
                  <th
                    style={{
                      textAlign: 'left',
                      padding: '16px 24px',
                      fontSize: 14,
                      fontWeight: 600,
                      color: '#666',
                      borderBottom: '1px solid #e0e0e0',
                    }}
                  >
                    Empresa
                  </th>
                  <th
                    style={{
                      textAlign: 'left',
                      padding: '16px 24px',
                      fontSize: 14,
                      fontWeight: 600,
                      color: '#666',
                      borderBottom: '1px solid #e0e0e0',
                    }}
                  >
                    CNPJ
                  </th>
                  <th
                    style={{
                      textAlign: 'left',
                      padding: '16px 24px',
                      fontSize: 14,
                      fontWeight: 600,
                      color: '#666',
                      borderBottom: '1px solid #e0e0e0',
                    }}
                  >
                    Telefone
                  </th>
                  <th
                    style={{
                      textAlign: 'left',
                      padding: '16px 24px',
                      fontSize: 14,
                      fontWeight: 600,
                      color: '#666',
                      borderBottom: '1px solid #e0e0e0',
                    }}
                  >
                    Perfil
                  </th>
                  <th
                    style={{
                      textAlign: 'left',
                      padding: '16px 24px',
                      fontSize: 14,
                      fontWeight: 600,
                      color: '#666',
                      borderBottom: '1px solid #e0e0e0',
                    }}
                  >
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {cadastrosPendentes.length === 0 && !loading && !error ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '20px' }}>
                      Nenhum cadastro pendente encontrado.
                    </td>
                  </tr>
                ) : (
                  cadastrosPendentes.map((user, index) => (
                    <tr
                      key={user.id}
                      style={{
                        borderBottom:
                          index < cadastrosPendentes.length - 1 ? '1px solid #f0f0f0' : 'none',
                        transition: 'background 0.2s',
                      }}
                    >
                      <td
                        style={{
                          padding: '16px 24px',
                          fontSize: 14,
                          color: '#333',
                        }}
                      >
                        {user.full_name}
                      </td>
                      <td
                        style={{
                          padding: '16px 24px',
                          fontSize: 14,
                          color: '#333',
                        }}
                      >
                        {user.email}
                      </td>
                      <td
                        style={{
                          padding: '16px 24px',
                          fontSize: 14,
                          color: '#333',
                        }}
                      >
                        {user.company_name || '-'}
                      </td>
                      <td
                        style={{
                          padding: '16px 24px',
                          fontSize: 14,
                          color: '#333',
                        }}
                      >
                        {user.cnpj || '-'}
                      </td>
                      <td
                        style={{
                          padding: '16px 24px',
                          fontSize: 14,
                          color: '#333',
                        }}
                      >
                        {user.phone || '-'}
                      </td>
                      <td
                        style={{
                          padding: '16px 24px',
                          fontSize: 14,
                          color: '#333',
                        }}
                      >
                        {translateRole(user.user_role)}
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            style={{
                              background: '#4caf50',
                              color: '#fff',
                              border: 'none',
                              borderRadius: 4,
                              padding: '6px 12px',
                              fontSize: 16,
                              cursor: 'pointer',
                              width: 36,
                              height: 36,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'background 0.2s',
                            }}
                            onMouseOver={e => (e.currentTarget.style.background = '#45a049')}
                            onMouseOut={e => (e.currentTarget.style.background = '#4caf50')}
                            onClick={() => handleApproveClick(user)}
                          >
                            ✓
                          </button>
                          <button
                            style={{
                              background: '#f44336',
                              color: '#fff',
                              border: 'none',
                              borderRadius: 4,
                              padding: '6px 12px',
                              fontSize: 16,
                              cursor: 'pointer',
                              width: 36,
                              height: 36,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'background 0.2s',
                            }}
                            onMouseOver={e => (e.currentTarget.style.background = '#da190b')}
                            onMouseOut={e => (e.currentTarget.style.background = '#f44336')}
                            onClick={() => handleReject(user.id)}
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
      </div>
      <ApproveRegistrationModal
        open={modalOpen}
        onClose={handleModalClose}
        onConfirm={handleModalConfirm}
        user={selectedUser}
      />
      <ConfirmDialog
        open={confirmDialogOpen}
        title="Recusar cadastro?"
        description="Tem certeza que deseja recusar e excluir este cadastro? Esta ação não pode ser desfeita."
        confirmText={rejectLoading ? 'Aguarde...' : 'Recusar'}
        cancelText="Cancelar"
        onConfirm={handleConfirmReject}
        onCancel={() => {
          logger.info('Reject confirmation dialog cancelled.');
          setConfirmDialogOpen(false);
          setRejectingUserId(null);
          setRejectError(null);
        }}
        loading={rejectLoading}
      />
      {rejectError && (
        <div style={{ color: 'red', textAlign: 'center', marginTop: 12 }}>{rejectError}</div>
      )}
    </div>
  );
};

export default PendingRegistrationsList;

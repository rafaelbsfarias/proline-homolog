'use client';
import React, { useState } from 'react';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';
import { useRouter } from 'next/navigation';
import { useUserList, UserProfile } from '../hooks/useUserList';
import ConfirmDialog from './ConfirmDialog';
import EditUserModal from './EditUserModal';
import { translateRole } from '../hooks/useUserList';
import { getLogger, ILogger } from '@/modules/logger';

const logger: ILogger = getLogger('UserList');

// Estilo dos botões de ação
const actionBtnStyle: React.CSSProperties = {
  padding: '6px 14px',
  minWidth: 110,
  fontSize: 15,
  borderRadius: 5,
  border: 'none',
  background: '#002e4c',
  color: '#fff',
  fontWeight: 500,
  marginRight: 8,
  marginBottom: 2,
  boxShadow: '0 1px 4px rgba(25,119,242,0.07)',
  cursor: 'pointer',
  transition: 'filter 0.2s',
};

const UserList: React.FC = () => {
  const { users, loading, error, filter, setFilter, refetch } = useUserList();
  const { authenticatedFetch } = useAuthenticatedFetch();
  const router = useRouter();

  // Estado para editar
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserProfile | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Estado para suspender/remover
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmType, setConfirmType] = useState<'suspender' | 'remover' | 'reativar' | null>(null);
  const [targetUser, setTargetUser] = useState<UserProfile | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  logger.debug('Rendering UserList component.');
  if (loading) {
    logger.info('UserList: Loading data...');
  }
  if (error) {
    logger.error('UserList: Error loading data:', error);
  }
  logger.debug(`User count: ${users.length}`);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#F0F2F5',
        width: '100vw',
        maxWidth: '98.5vw',
        margin: 0,
        padding: 0,
        overflowX: 'hidden',
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: '40px auto',
          background: '#fff',
          borderRadius: 16,
          boxShadow: '0 4px 24px 0 rgba(0,0,0,0.10)',
          padding: '0px 32px 24px 32px',
          display: 'flex',
          flexDirection: 'column',
          gap: 0,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            marginBottom: 24,
            marginTop: 32,
          }}
        >
          <button
            onClick={() => {
              logger.info('Back button clicked.');
              router.back();
            }}
            style={{
              padding: '8px 20px',
              fontSize: 16,
              borderRadius: 6,
              border: 'none',
              background: '#002e4c',
              color: '#fff',
              fontWeight: 500,
              boxShadow: '0 2px 8px rgba(25,119,242,0.08)',
              cursor: 'pointer',
              transition: 'filter 0.2s',
            }}
            onMouseOver={e => (e.currentTarget.style.filter = 'brightness(1.08)')}
            onMouseOut={e => (e.currentTarget.style.filter = 'none')}
          >
            &#8592; Voltar
          </button>
          <h2 style={{ margin: 0 }}>Usuários do Sistema</h2>
        </div>
        <input
          type="text"
          placeholder="Buscar por nome, email ou perfil"
          value={filter}
          onChange={e => {
            logger.debug(`Filter changed to: ${e.target.value}`);
            setFilter(e.target.value);
          }}
          style={{ marginBottom: 16, padding: 8, width: 320, display: 'block' }}
        />
        {loading && <div>Carregando...</div>}
        {error && <div style={{ color: 'red' }}>{error}</div>}
        <table
          style={{
            width: '100%',
            borderCollapse: 'separate',
            borderSpacing: 0,
            background: '#fff',
            borderRadius: 8,
            overflow: 'hidden',
            boxShadow: 'none',
          }}
        >
          <thead style={{ background: '#f5f7fa' }}>
            <tr>
              <th style={{ textAlign: 'left', padding: '12px 16px' }}>Nome</th>
              <th style={{ textAlign: 'left', padding: '12px 16px' }}>Email</th>
              <th style={{ textAlign: 'left', padding: '12px 16px' }}>Perfil</th>
              <th style={{ textAlign: 'left', padding: '12px 16px' }}>Status</th>
              <th style={{ textAlign: 'left', padding: '12px 16px' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td style={{ textAlign: 'left' }}>{user.full_name}</td>
                <td style={{ textAlign: 'left' }}>{user.email}</td>
                <td style={{ textAlign: 'left' }}>{translateRole(user.role)}</td>
                <td style={{ textAlign: 'left' }}>{user.status || 'ativo'}</td>
                <td style={{ textAlign: 'left' }}>
                  <button
                    style={actionBtnStyle}
                    onClick={() => {
                      logger.info(`Edit click for user: ${user.email} (ID: ${user.id})`);
                      setEditUser(user);
                      setEditModalOpen(true);
                      setEditError(null);
                    }}
                    onMouseOver={e => (e.currentTarget.style.filter = 'brightness(1.08)')}
                    onMouseOut={e => (e.currentTarget.style.filter = 'none')}
                  >
                    Editar
                  </button>
                  {user.status === 'suspenso' ? (
                    <button
                      style={{
                        ...actionBtnStyle,
                        background: 'linear-gradient(90deg, #388e3c 1000%, #388e3c 100%)',
                      }}
                      onClick={() => {
                        logger.info(`Reactivate click for user: ${user.email} (ID: ${user.id})`);
                        setTargetUser(user);
                        setConfirmType('reativar');
                        setConfirmDialogOpen(true);
                        setActionError(null);
                      }}
                      onMouseOver={e => (e.currentTarget.style.filter = 'brightness(1.08)')}
                      onMouseOut={e => (e.currentTarget.style.filter = 'none')}
                    >
                      Reativar
                    </button>
                  ) : (
                    <button
                      style={{
                        ...actionBtnStyle,
                        background: 'linear-gradient(90deg, #7c5c04 100%, #7c5c04 100%)',
                      }}
                      onClick={() => {
                        logger.info(`Suspend click for user: ${user.email} (ID: ${user.id})`);
                        setTargetUser(user);
                        setConfirmType('suspender');
                        setConfirmDialogOpen(true);
                        setActionError(null);
                      }}
                      onMouseOver={e => (e.currentTarget.style.filter = 'brightness(1.08)')}
                      onMouseOut={e => (e.currentTarget.style.filter = 'none')}
                    >
                      Suspender
                    </button>
                  )}
                  <button
                    style={{
                      ...actionBtnStyle,
                      background: 'linear-gradient(90deg, #b71c1c 100%, #b71c1c 100%)',
                    }}
                    onClick={() => {
                      logger.info(`Remove click for user: ${user.email} (ID: ${user.id})`);
                      setTargetUser(user);
                      setConfirmType('remover');
                      setConfirmDialogOpen(true);
                      setActionError(null);
                    }}
                    onMouseOver={e => (e.currentTarget.style.filter = 'brightness(1.08)')}
                    onMouseOut={e => (e.currentTarget.style.filter = 'none')}
                  >
                    Remover
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div>
          <button
            onClick={() => {
              logger.info('Refresh list button clicked.');
              refetch();
            }}
            style={{
              marginTop: 16,
              padding: '8px 20px',
              fontSize: 16,
              borderRadius: 6,
              border: 'none',
              background: '#072E4C',
              color: '#fff',
              fontWeight: 500,
              boxShadow: '0 2px 8px rgba(25,119,242,0.08)',
              cursor: 'pointer',
              transition: 'filter 0.2s',
              display: 'inline-block',
            }}
            onMouseOver={e => (e.currentTarget.style.filter = 'brightness(1.08)')}
            onMouseOut={e => (e.currentTarget.style.filter = 'none')}
          >
            Atualizar lista
          </button>
        </div>
      </div>
      <EditUserModal
        open={editModalOpen}
        user={editUser}
        onClose={() => {
          logger.info('Edit user modal closed.');
          setEditModalOpen(false);
          setEditUser(null);
          setEditError(null);
        }}
        onSave={async fields => {
          if (!editUser) {
            logger.warn('Attempted to save edit without a selected user.');
            return;
          }
          logger.info(`Saving edits for user: ${editUser.email} (ID: ${editUser.id})`);
          logger.debug('Edit fields:', fields);
          setEditLoading(true);
          setEditError(null);
          try {
            const res = await authenticatedFetch('/api/admin/edit-user', {
              method: 'POST',
              body: JSON.stringify({ userId: editUser.id, ...fields }),
            });
            if (!res.ok) {
              const errorMessage = res.error || 'Erro ao editar usuário.';
              logger.error('Failed to edit user:', errorMessage);
              throw new Error(errorMessage);
            }
            logger.info(`User ${editUser.id} edited successfully.`);
            setEditModalOpen(false);
            setEditUser(null);
            refetch();
          } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Erro ao editar usuário.';
            logger.error('Error during user edit:', errorMessage, error);
            setEditError(errorMessage);
          } finally {
            setEditLoading(false);
            logger.info('Edit user process finished, refetching user list.');
          }
        }}
        loading={editLoading}
      />
      <ConfirmDialog
        open={confirmDialogOpen}
        title={
          confirmType === 'remover'
            ? 'Remover usuário?'
            : confirmType === 'reativar'
              ? 'Reativar usuário?'
              : 'Suspender usuário?'
        }
        description={
          confirmType === 'remover'
            ? 'Tem certeza que deseja remover este usuário? Esta ação não pode ser desfeita.'
            : confirmType === 'reativar'
              ? 'Tem certeza que deseja reativar este usuário? Ele poderá voltar a acessar o sistema.'
              : 'Tem certeza que deseja suspender este usuário? Ele não poderá acessar o sistema até ser reativado.'
        }
        confirmText={
          actionLoading
            ? 'Aguarde...'
            : confirmType === 'remover'
              ? 'Remover'
              : confirmType === 'reativar'
                ? 'Reativar'
                : 'Suspender'
        }
        cancelText="Cancelar"
        onConfirm={async () => {
          if (!targetUser) {
            logger.warn('Attempted to confirm action without a target user.');
            return;
          }
          logger.info(
            `Confirming action "${confirmType}" for user: ${targetUser.email} (ID: ${targetUser.id})`
          );
          setActionLoading(true);
          setActionError(null);
          try {
            let url = '/api/admin/suspend-user';
            let body: { userId: string; reactivate?: boolean } = { userId: targetUser.id };
            if (confirmType === 'remover') {
              url = '/api/admin/remove-user';
            } else if (confirmType === 'reativar') {
              url = '/api/admin/suspend-user';
              body = { userId: targetUser.id, reactivate: true };
            }
            const response = await authenticatedFetch(url, {
              method: 'POST',
              body: JSON.stringify(body),
            });
            if (!response.ok) {
              const errorMessage = response.error || 'Erro ao executar ação.';
              logger.error(
                `Failed to execute action "${confirmType}" for user ${targetUser.id}:`,
                errorMessage
              );
              throw new Error(errorMessage);
            }
            logger.info(`Action "${confirmType}" for user ${targetUser.id} executed successfully.`);
            setConfirmDialogOpen(false);
            setTargetUser(null);
            refetch();
          } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Erro ao executar ação.';
            logger.error('Error during user action:', errorMessage, error);
            setActionError(errorMessage);
          } finally {
            setActionLoading(false);
            logger.info('User action process finished, refetching user list.');
          }
        }}
        onCancel={() => {
          logger.info('Action confirmation dialog cancelled.');
          setConfirmDialogOpen(false);
          setTargetUser(null);
          setActionError(null);
        }}
        loading={actionLoading}
      />
      {(editError || actionError) && (
        <div style={{ color: 'red', textAlign: 'center', marginTop: 12 }}>
          {editError || actionError}
        </div>
      )}
    </div>
  );
};

export default UserList;

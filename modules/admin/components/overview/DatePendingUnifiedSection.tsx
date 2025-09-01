import React from 'react';
import styles from '@/app/admin/clients/[id]/overview/page.module.css';
import { isoToBr } from '@/modules/common/components/date-picker/utils';
import { formatCurrencyBR, formatTotalCurrencyBR } from '@/modules/common/utils/format';
import ProposeCollectionDateModal from './ProposeCollectionDateModal';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';

type Row = {
  addressId: string;
  address: string;
  vehicle_count: number;
  collection_fee: number | null;
  collection_date: string | null;
  proposed_by?: 'client' | 'admin';
};

interface Props {
  clientId: string;
  groups: Row[];
  total?: number;
  onRefresh?: () => void | Promise<void>;
}

const DatePendingUnifiedSection: React.FC<Props> = ({ clientId, groups, total = 0, onRefresh }) => {
  const { post } = useAuthenticatedFetch();
  const [proposingFor, setProposingFor] = React.useState<{
    addressId: string;
    address: string;
  } | null>(null);
  const [proposedDate, setProposedDate] = React.useState<string>('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);

  if (!groups?.length) return null;

  const acceptDate = async (addressId: string) => {
    setLoading(true);
    setError(null);
    try {
      const resp = await post('/api/admin/accept-client-proposed-date', { clientId, addressId });
      if (!resp.ok) throw new Error(resp.error || 'Falha ao aceitar data');
      if (onRefresh) await onRefresh();
    } catch (e: unknown) {
      const error = e as Error;
      setError(error.message || 'Falha ao aceitar data');
    } finally {
      setLoading(false);
    }
  };

  const rejectDate = async (addressId: string) => {
    setLoading(true);
    setError(null);
    try {
      const resp = await post('/api/admin/reject-client-proposed-date', { clientId, addressId });
      if (!resp.ok) throw new Error(resp.error || 'Falha ao rejeitar proposta');
      if (onRefresh) await onRefresh();
    } catch (e: unknown) {
      const error = e as Error;
      setError(error.message || 'Falha ao rejeitar proposta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.tableWrap}>
      <h3 className={styles.sectionTitle}>Aprovação de nova data</h3>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.thLeft}>Ponto de coleta</th>
            <th className={styles.thCenter}>Veículos</th>
            <th className={styles.thCenter}>Origem</th>
            <th className={styles.thCenter}>Data proposta</th>
            <th className={styles.thCenter}>Valor por veículo (R$)</th>
            <th className={styles.thCenter}>Total por endereço (R$)</th>
            <th className={styles.thCenter}>Ações</th>
          </tr>
        </thead>
        <tbody>
          {groups.map(g => (
            <tr key={`${g.addressId}|${g.collection_date || ''}`}>
              <td>{g.address}</td>
              <td className={styles.thCenter}>{g.vehicle_count}</td>
              <td className={styles.thCenter}>
                {g.proposed_by === 'client' ? 'Cliente' : 'Admin'}
              </td>
              <td className={styles.thCenter}>
                {g.collection_date ? isoToBr(g.collection_date) : '-'}
              </td>
              <td className={styles.nowrap}>{formatCurrencyBR(g.collection_fee)}</td>
              <td className={styles.nowrap}>
                {formatTotalCurrencyBR(g.collection_fee, g.vehicle_count || 0)}
              </td>
              <td className={styles.thCenter}>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                  {g.proposed_by === 'client' && (
                    <>
                      <button
                        type="button"
                        disabled={loading}
                        onClick={() => acceptDate(g.addressId)}
                        title="Aceitar a data proposta pelo cliente"
                        style={{
                          backgroundColor: '#28a745',
                          color: 'white',
                          border: 'none',
                          padding: '4px 8px',
                          borderRadius: '4px',
                        }}
                      >
                        ✓ Aceitar
                      </button>
                      <button
                        type="button"
                        disabled={loading}
                        onClick={() => rejectDate(g.addressId)}
                        title="Rejeitar a proposta do cliente"
                        style={{
                          backgroundColor: '#dc3545',
                          color: 'white',
                          border: 'none',
                          padding: '4px 8px',
                          borderRadius: '4px',
                        }}
                      >
                        ✗ Rejeitar
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => {
                      setProposingFor({ addressId: g.addressId, address: g.address });
                      setProposedDate(g.collection_date || '');
                      setError(null);
                      setMessage(null);
                    }}
                    title="Propor uma nova data"
                    style={{
                      backgroundColor: '#007bff',
                      color: 'white',
                      border: 'none',
                      padding: '4px 8px',
                      borderRadius: '4px',
                    }}
                  >
                    {g.proposed_by === 'client' ? '📅 Propor nova data' : '✏️ Editar proposta'}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={5} className={styles.totalsRow}>
              Total geral:
            </td>
            <td className={styles.nowrap} colSpan={2}>
              {Number(total || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </td>
          </tr>
        </tfoot>
      </table>

      {proposingFor && (
        <ProposeCollectionDateModal
          addressLabel={proposingFor.address}
          initialDateIso={proposedDate}
          loading={loading}
          error={error || undefined}
          successMessage={message || undefined}
          onClose={() => setProposingFor(null)}
          onChangeDate={setProposedDate}
          onConfirm={async () => {
            setLoading(true);
            setError(null);
            setMessage(null);
            try {
              const resp = await post(`/api/admin/propose-collection-date`, {
                clientId,
                addressId: proposingFor.addressId,
                new_date: proposedDate,
              });
              if (!resp.ok) throw new Error(resp.error || 'Falha ao propor data');
              setMessage('Proposta enviada com sucesso.');
              if (onRefresh) await onRefresh();
              setTimeout(() => setProposingFor(null), 700);
            } catch (e: unknown) {
              const error = e as Error;
              setError(error.message || 'Falha ao propor data');
            } finally {
              setLoading(false);
            }
          }}
        />
      )}
    </div>
  );
};

export default DatePendingUnifiedSection;

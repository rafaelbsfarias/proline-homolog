import React from 'react';
import styles from '@/app/admin/clients/[id]/overview/page.module.css';
import { isoToBr } from '@/modules/common/components/date-picker/utils';
import { formatCurrencyBR } from '@/modules/common/utils/format';
import ProposeCollectionDateModal from './ProposeCollectionDateModal';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';

type Row = {
  addressId: string;
  address: string;
  vehicle_count: number;
  collection_fee: number | null;
  collection_date: string | null;
};

interface Props {
  clientId: string;
  groups: Row[];
  onRefresh?: () => void | Promise<void>;
}

const DateChangeRequestedSection: React.FC<Props> = ({ clientId, groups, onRefresh }) => {
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
    } catch (e: any) {
      setError(e.message || 'Falha ao aceitar data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.tableWrap}>
      <h3 className={styles.sectionTitle}>Mudança de data solicitada</h3>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.thLeft}>Ponto de coleta</th>
            <th className={styles.thCenter}>Veículos</th>
            <th className={styles.thCenter}>Valor por veículo (R$)</th>
            <th className={styles.thCenter}>Data proposta</th>
            <th className={styles.thCenter}>Ações</th>
          </tr>
        </thead>
        <tbody>
          {groups.map(g => (
            <tr key={`${g.addressId}|${g.collection_date || ''}`}>
              <td>{g.address}</td>
              <td className={styles.thCenter}>{g.vehicle_count}</td>
              <td className={styles.nowrap}>{formatCurrencyBR(g.collection_fee)}</td>
              <td className={styles.thCenter}>
                {g.collection_date ? isoToBr(g.collection_date) : '-'}
              </td>
              <td className={styles.thCenter}>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => acceptDate(g.addressId)}
                    title="Aceitar a data proposta pelo cliente"
                  >
                    Aceitar data
                  </button>
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
                  >
                    Propor nova data
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
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
            } catch (e: any) {
              setError(e.message || 'Falha ao propor data');
            } finally {
              setLoading(false);
            }
          }}
        />
      )}
    </div>
  );
};

export default DateChangeRequestedSection;

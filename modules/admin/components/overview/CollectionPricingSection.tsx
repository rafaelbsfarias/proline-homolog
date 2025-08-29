import React, { useMemo, useState } from 'react';
import { CollectionPricingRequest } from '@/modules/admin/hooks/useClientOverview';
import CurrencyInput from '@/modules/common/components/CurrencyInput';
import styles from '@/app/admin/clients/[id]/overview/page.module.css';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';
import { isoToBr } from '@/modules/common/components/date-picker/utils';
import { formatCurrencyBR, formatTotalCurrencyBR } from '@/modules/common/utils/format';
import ProposeCollectionDateModal from './ProposeCollectionDateModal';

interface Props {
  clientId: string;
  requests: CollectionPricingRequest[];
  onSave: (
    rows: {
      collectionId: string;
      collectionFeePerVehicle: number;
      collectionDate?: string;
    }[]
  ) => Promise<void>;
  loading?: boolean;
  onRefresh?: () => Promise<void> | void;
  onAfterSaveAskDates?: (
    items: { addressId: string; address: string; dateIso?: string | null }[]
  ) => void;
}

const CollectionPricingSection: React.FC<Props> = ({
  clientId,
  requests,
  onSave,
  loading,
  onRefresh,
  onAfterSaveAskDates,
}) => {
  const { post } = useAuthenticatedFetch();
  const [fees, setFees] = useState<Record<string, number | undefined>>(() =>
    Object.fromEntries(requests.map(r => [r.addressId, r.collection_fee ?? undefined]))
  );
  React.useEffect(() => {
    setFees(prev => {
      const next = { ...prev } as Record<string, number | undefined>;
      for (const r of requests) {
        const key = r.addressId;
        if (next[key] === undefined && typeof r.collection_fee === 'number') {
          next[key] = r.collection_fee;
        }
      }
      return next;
    });
  }, [requests]);
  const [proposingFor, setProposingFor] = useState<{ addressId: string; address: string } | null>(
    null
  );
  const [proposedDate, setProposedDate] = useState<string>('');
  const [proposeLoading, setProposeLoading] = useState(false);
  const [proposeError, setProposeError] = useState<string | null>(null);
  const [proposeMessage, setProposeMessage] = useState<string | null>(null);

  const total = useMemo(
    () =>
      requests.reduce((acc, r) => acc + Number(fees[r.addressId] || 0) * (r.vehicle_count || 0), 0),
    [requests, fees]
  );

  if (!requests.length) return null;

  return (
    <div className={styles.tableWrap}>
      <h3 className={styles.sectionTitle}>Pontos de coleta para precificação</h3>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.thLeft}>Ponto de coleta</th>
            <th className={styles.thCenter}>Veículos</th>
            <th className={styles.thCenter}>Valor da coleta (R$)</th>
            <th className={styles.thCenter}>Total estimado (R$)</th>
            <th className={styles.thCenter}>Data da coleta</th>
            <th className={styles.thCenter}>Ações</th>
          </tr>
        </thead>
        <tbody>
          {requests.map(req => (
            <tr key={req.addressId}>
              <td>{req.address}</td>
              <td className={styles.thCenter}>{req.vehicle_count}</td>
              <td className={styles.thCenter}>
                <CurrencyInput
                  value={fees[req.addressId]}
                  onChange={v => setFees(prev => ({ ...prev, [req.addressId]: v }))}
                  placeholder="0,00"
                />
              </td>
              <td className={styles.estimatedTotal}>
                {formatTotalCurrencyBR(fees[req.addressId], req.vehicle_count || 0)}
              </td>
              <td className={styles.thCenter}>
                {req.proposed_date
                  ? isoToBr(req.proposed_date)
                  : req.collection_date
                    ? isoToBr(req.collection_date)
                    : '-'}
              </td>
              <td className={styles.thCenter}>
                <button
                  type="button"
                  disabled={
                    !(typeof fees[req.addressId] === 'number' && Number(fees[req.addressId]) > 0)
                  }
                  title={
                    typeof fees[req.addressId] === 'number' && Number(fees[req.addressId]) > 0
                      ? 'Propor nova data'
                      : 'Defina o valor da coleta antes de propor data'
                  }
                  onClick={() => {
                    setProposingFor({ addressId: req.addressId, address: req.address });
                    setProposedDate(req.proposed_date || '');
                    setProposeError(null);
                    setProposeMessage(null);
                  }}
                >
                  Propor nova data
                </button>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={3} style={{ textAlign: 'right', fontWeight: 600 }}>
              Total estimado geral:
            </td>
            <td className={styles.estimatedTotal}>{formatCurrencyBR(total)}</td>
            <td />
            <td />
          </tr>
        </tfoot>
      </table>

      <div className={styles.actions}>
        <button
          disabled={loading}
          onClick={() => {
            const payload = requests
              .map(r => ({
                collectionId: r.addressId,
                collectionFeePerVehicle: Number(fees[r.addressId] || 0),
                collectionDate: r.collection_date || undefined,
                address: r.address,
                proposedOrClientDate: r.proposed_date || r.collection_date || undefined,
              }))
              .filter(
                x =>
                  typeof x.collectionFeePerVehicle === 'number' &&
                  !Number.isNaN(x.collectionFeePerVehicle)
              );

            // Inform parent which addresses to ask date adequacy for (only those with a date visible)
            if (onAfterSaveAskDates) {
              const items = payload
                .filter(p => !!p.proposedOrClientDate && p.collectionFeePerVehicle > 0)
                .map(p => ({
                  addressId: p.collectionId,
                  address: p.address,
                  dateIso: p.proposedOrClientDate,
                }));
              if (items.length) onAfterSaveAskDates(items);
            }

            return onSave(
              payload.map(({ collectionId, collectionFeePerVehicle, collectionDate }) => ({
                collectionId,
                collectionFeePerVehicle,
                collectionDate,
              }))
            );
          }}
        >
          {loading ? 'Salvando...' : 'Salvar'}
        </button>
      </div>

      {proposingFor && (
        <ProposeCollectionDateModal
          addressLabel={proposingFor.address}
          initialDateIso={proposedDate}
          loading={proposeLoading}
          error={proposeError || undefined}
          successMessage={proposeMessage || undefined}
          onClose={() => setProposingFor(null)}
          onChangeDate={setProposedDate}
          onConfirm={async () => {
            setProposeLoading(true);
            setProposeError(null);
            setProposeMessage(null);
            try {
              const resp = await post(`/api/admin/propose-collection-date`, {
                clientId,
                addressId: proposingFor.addressId,
                new_date: proposedDate,
              });
              if (!resp.ok) throw new Error(resp.error || 'Falha ao propor data');
              setProposeMessage('Proposta enviada com sucesso.');
              if (onRefresh) await onRefresh();
              setTimeout(() => setProposingFor(null), 700);
            } catch (e: any) {
              setProposeError(e.message || 'Falha ao propor data');
            } finally {
              setProposeLoading(false);
            }
          }}
        />
      )}
    </div>
  );
};

export default CollectionPricingSection;

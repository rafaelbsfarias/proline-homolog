import React, { useMemo, useState } from 'react';
import { CollectionPricingRequest } from '@/modules/admin/hooks/useClientOverview';
import CurrencyInput from '@/modules/common/components/CurrencyInput';
import styles from '@/app/admin/clients/[id]/overview/page.module.css';
import DatePickerBR from '@/modules/common/components/DatePickerBR';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';
import { isoToBr } from '@/modules/common/components/date-picker/utils';

interface Props {
  clientId: string;
  requests: CollectionPricingRequest[];
  onSave: (rows: { collectionId: string; collectionFeePerVehicle: number }[]) => Promise<void>;
  loading?: boolean;
  onRefresh?: () => Promise<void> | void;
}

const CollectionPricingSection: React.FC<Props> = ({
  clientId,
  requests,
  onSave,
  loading,
  onRefresh,
}) => {
  const { post } = useAuthenticatedFetch();
  const [fees, setFees] = useState<Record<string, number | undefined>>(() =>
    Object.fromEntries(requests.map(r => [r.addressId, r.collection_fee ?? undefined]))
  );
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
                {typeof fees[req.addressId] === 'number'
                  ? (Number(fees[req.addressId]) * (req.vehicle_count || 0)).toLocaleString(
                      'pt-BR',
                      {
                        style: 'currency',
                        currency: 'BRL',
                      }
                    )
                  : '-'}
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
                  onClick={() => {
                    setProposingFor({ addressId: req.addressId, address: req.address });
                    setProposedDate('');
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
            <td className={styles.estimatedTotal}>
              {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </td>
            <td />
            <td />
          </tr>
        </tfoot>
      </table>

      <div className={styles.actions}>
        <button
          disabled={loading}
          onClick={() =>
            onSave(
              requests
                .map(r => ({
                  collectionId: r.addressId,
                  collectionFeePerVehicle: Number(fees[r.addressId] || 0),
                }))
                .filter(
                  x =>
                    typeof x.collectionFeePerVehicle === 'number' &&
                    !Number.isNaN(x.collectionFeePerVehicle)
                )
            )
          }
        >
          {loading ? 'Salvando...' : 'Salvar'}
        </button>
      </div>

      {proposingFor && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
        >
          <div style={{ background: '#fff', padding: '1rem', borderRadius: 8, minWidth: 360 }}>
            <h4 style={{ marginTop: 0, marginBottom: '.5rem' }}>Propor nova data</h4>
            <p style={{ marginTop: 0 }}>Endereço: {proposingFor.address}</p>
            <div style={{ margin: '8px 0 16px' }}>
              <DatePickerBR valueIso={proposedDate} onChangeIso={setProposedDate} />
            </div>
            {proposeError && (
              <div style={{ color: '#b00020', marginBottom: 8 }}>{proposeError}</div>
            )}
            {proposeMessage && (
              <div style={{ color: '#0b8043', marginBottom: 8 }}>{proposeMessage}</div>
            )}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button type="button" disabled={proposeLoading} onClick={() => setProposingFor(null)}>
                Cancelar
              </button>
              <button
                type="button"
                disabled={proposeLoading || !proposedDate}
                onClick={async () => {
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
                    setProposeMessage('Proposta enviado com sucesso.');
                    if (onRefresh) await onRefresh();
                    setTimeout(() => setProposingFor(null), 700);
                  } catch (e: any) {
                    setProposeError(e.message || 'Falha ao propor data');
                  } finally {
                    setProposeLoading(false);
                  }
                }}
              >
                {proposeLoading ? 'Enviando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollectionPricingSection;

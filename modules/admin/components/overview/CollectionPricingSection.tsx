import React, { useMemo, useState } from 'react';
import { CollectionPricingRequest } from '@/modules/admin/hooks/useClientOverview';
import CurrencyInput from '@/modules/common/components/CurrencyInput';
import DatePickerBR from '@/modules/common/components/DatePickerBR';
import styles from '@/app/admin/clients/[id]/overview/page.module.css';

interface Props {
  clientId: string;
  requests: CollectionPricingRequest[];
  onSave: (
    rows: { collectionId: string; collectionFeePerVehicle: number; date?: string }[]
  ) => Promise<void>;
  loading?: boolean;
}

const CollectionPricingSection: React.FC<Props> = ({ clientId, requests, onSave, loading }) => {
  const [fees, setFees] = useState<Record<string, number | undefined>>(() =>
    Object.fromEntries(requests.map(r => [r.addressId, r.collection_fee ?? undefined]))
  );
  const [dates, setDates] = useState<Record<string, string>>({});

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
            <th className={styles.thCenter}>Data de Coleta</th>
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
                <DatePickerBR
                  value={dates[req.addressId] || ''}
                  onChange={v => setDates(prev => ({ ...prev, [req.addressId]: v }))}
                />
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
                  date: dates[r.addressId] || undefined,
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
    </div>
  );
};

export default CollectionPricingSection;

import React from 'react';
import styles from '@/app/admin/clients/[id]/overview/page.module.css';
import { HistoryRow } from '@/modules/admin/services/client-collections/types';
import { isoToBr } from '@/modules/common/components/date-picker/utils';
import { formatCurrencyBR } from '@/modules/common/utils/format';

interface Props {
  history: HistoryRow[];
}

const CollectionHistory: React.FC<Props> = ({ history }) => {
  if (!history?.length) return null;

  return (
    <div className={styles.tableWrap}>
      <h3 className={styles.sectionTitle}>Histórico</h3>
      <table className={styles.subtable}>
        <thead>
          <tr>
            <th>Endereço</th>
            <th>Data</th>
            <th>Veículos</th>
            <th>Valor por veículo (R$)</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {history.map((r, i) => (
            <tr key={`${r.collection_address}|${r.collection_date || ''}|${i}`}>
              <td>{r.collection_address}</td>
              <td className={styles.nowrap}>
                {r.collection_date ? isoToBr(r.collection_date) : '-'}
              </td>
              <td>
                {r.vehicles && r.vehicles.length ? r.vehicles.map(v => v.plate).join(', ') : '-'}
              </td>
              <td className={styles.nowrap}>{formatCurrencyBR(r.collection_fee_per_vehicle)}</td>
              <td>{r.status || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CollectionHistory;

import React from 'react';
import styles from '@/app/admin/clients/[id]/overview/page.module.css';
import { HistoryRow } from '@/modules/admin/hooks/useClientOverview';

interface Props {
  history: HistoryRow[];
}

const CollectionHistory: React.FC<Props> = ({ history }) => {
  if (!history?.length) return null;

  return (
    <div className={styles.tableWrap}>
      <h3 className={styles.sectionTitle}>Histórico de coletas</h3>
      <table className={styles.subtable}>
        <thead>
          <tr>
            <th>Endereço</th>
            <th>Data</th>
            <th>Valor por veículo (R$)</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {history.map((r, i) => (
            <tr key={`${r.collection_address}|${r.collection_date || ''}|${i}`}>
              <td>{r.collection_address}</td>
              <td className={styles.nowrap}>{r.collection_date || '-'}</td>
              <td className={styles.nowrap}>
                {typeof r.collection_fee_per_vehicle === 'number'
                  ? r.collection_fee_per_vehicle.toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    })
                  : '-'}
              </td>
              <td>{r.status || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CollectionHistory;

import React from 'react';
import { PendingApprovalGroup } from '@/modules/admin/hooks/useClientOverview';
import styles from '@/app/admin/clients/[id]/overview/page.module.css';

interface Props {
  groups: PendingApprovalGroup[];
  total?: number;
}

const PendingApprovalSection: React.FC<Props> = ({ groups, total = 0 }) => {
  if (!groups.length) return null;

  return (
    <div className={styles.tableWrap}>
      <h3 className={styles.sectionTitle}>Resumo da coleta (aguardando aprovação)</h3>
      <table className={styles.subtable}>
        <thead>
          <tr>
            <th>Ponto de coleta</th>
            <th>Veículos</th>
            <th>Data de coleta</th>
            <th>Valor por endereço (R$)</th>
            <th>Total por endereço (R$)</th>
          </tr>
        </thead>
        <tbody>
          {groups.map(g => (
            <tr key={`${g.addressId}|${g.collection_date || ''}`}>
              <td>{g.address}</td>
              <td>{g.vehicle_count}</td>
              <td className={styles.nowrap}>{g.collection_date || '-'}</td>
              <td className={styles.nowrap}>
                {typeof g.collection_fee === 'number'
                  ? g.collection_fee.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                  : '-'}
              </td>
              <td className={styles.nowrap}>
                {typeof g.collection_fee === 'number'
                  ? (g.collection_fee * (g.vehicle_count || 0)).toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    })
                  : '-'}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={4} className={styles.totalsRow}>
              Total geral da coleta:
            </td>
            <td className={styles.nowrap}>
              {Number(total || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

export default PendingApprovalSection;

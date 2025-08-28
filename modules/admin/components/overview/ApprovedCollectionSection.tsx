import React from 'react';
import { ApprovedCollectionGroup } from '@/modules/admin/hooks/useClientOverview';
import styles from '@/app/admin/clients/[id]/overview/page.module.css';

interface Props {
  clientId: string;
  groups: ApprovedCollectionGroup[];
  onMarkPaid: (row: { clientId: string; address: string; date: string | null }) => Promise<void>;
  total?: number;
  loading?: boolean;
}

const ApprovedCollectionSection: React.FC<Props> = ({
  clientId,
  groups,
  onMarkPaid,
  total = 0,
  loading,
}) => {
  if (!groups.length) return null;

  return (
    <div className={styles.tableWrap}>
      <h3 className={styles.sectionTitle}>Coletas aprovadas</h3>
      <p className={styles.muted}>
        Coletas aprovadas pelo cliente que aguardam confirmação de pagamento.
      </p>
      <table className={styles.subtable}>
        <thead>
          <tr>
            <th>Ponto de coleta</th>
            <th>Veículos</th>
            <th>Data de coleta</th>
            <th>Valor por endereço (R$)</th>
            <th>Total por endereço (R$)</th>
            <th>Ações</th>
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
              <td>{/* Botão de confirmação de pagamento removido conforme solicitação */}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={4} className={styles.totalsRow}>
              Total aprovado:
            </td>
            <td className={styles.nowrap}>
              {Number(total || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </td>
            <td />
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

export default ApprovedCollectionSection;

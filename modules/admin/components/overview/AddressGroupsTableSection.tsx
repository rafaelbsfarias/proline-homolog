import React from 'react';
import styles from '@/app/admin/clients/[id]/overview/page.module.css';
import { isoToBr } from '@/modules/common/components/date-picker/utils';
import { formatCurrencyBR, formatTotalCurrencyBR } from '@/modules/common/utils/format';

export type AddressGroupRow = {
  addressId: string;
  address: string;
  vehicle_count: number;
  collection_fee: number | null;
  collection_date: string | null;
};

interface Props<T extends AddressGroupRow = AddressGroupRow> {
  title: string;
  groups: T[];
  total?: number;
  totalLabel?: string;
}

const AddressGroupsTableSection = <T extends AddressGroupRow>({
  title,
  groups,
  total = 0,
  totalLabel = 'Total',
}: Props<T>) => {
  if (!groups?.length) return null;

  return (
    <div className={styles.tableWrap}>
      <h3 className={styles.sectionTitle}>{title}</h3>
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
              <td className={styles.nowrap}>
                {g.collection_date ? isoToBr(g.collection_date) : '-'}
              </td>
              <td className={styles.nowrap}>{formatCurrencyBR(g.collection_fee)}</td>
              <td className={styles.nowrap}>
                {formatTotalCurrencyBR(g.collection_fee, g.vehicle_count || 0)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={4} className={styles.totalsRow}>
              {totalLabel}:
            </td>
            <td className={styles.nowrap}>{formatCurrencyBR(Number(total || 0))}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

export default AddressGroupsTableSection;

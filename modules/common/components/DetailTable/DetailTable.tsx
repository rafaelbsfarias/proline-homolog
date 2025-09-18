import React from 'react';
import styles from './DetailTable.module.css';

export type DetailItem = {
  label: string;
  value: string | number | React.ReactNode;
};

interface DetailTableProps {
  items: DetailItem[];
}

const DetailTable: React.FC<DetailTableProps> = ({ items }) => {
  return (
    <table className={styles.detailTable}>
      <tbody>
        {items.map((item, idx) => (
          <tr key={idx}>
            <th className={styles.label}>{item.label}</th>
            <td className={styles.value}>{item.value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default DetailTable;

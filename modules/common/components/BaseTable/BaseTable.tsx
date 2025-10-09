import React from 'react';
import styles from './BaseTable.module.css';

interface Column<T> {
  key: keyof T | string;
  label: string;
  align?: 'left' | 'center' | 'right';
  render?: (value: any, row: T) => React.ReactNode;
}

interface BaseTableProps<T> {
  data: T[];
  columns: Column<T>[];
  getRowKey: (row: T) => string;
}

const BaseTable = <T,>({ data, columns, getRowKey }: BaseTableProps<T>) => {
  return (
    <table className={styles.table}>
      <thead>
        <tr className={styles.headerRow}>
          {columns.map(col => (
            <th
              key={String(col.key)}
              className={col.align === 'center' ? styles.headerCellCenter : styles.headerCell}
            >
              {col.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map(row => (
          <tr key={getRowKey(row)} className={styles.bodyRow}>
            {columns.map(col => (
              <td
                key={String(col.key)}
                className={col.align === 'center' ? styles.cellCenter : styles.cell}
              >
                {col.render ? col.render((row as any)[col.key], row) : (row as any)[col.key]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default BaseTable;

import React from 'react';

interface DataTableProps<T> {
  title: string;
  data: T[];
  columns: { key: keyof T; header: string }[];
  emptyMessage: string;
}

const DataTable = <T extends { id: React.Key }>({
  title,
  data,
  columns,
  emptyMessage,
}: DataTableProps<T>) => {
  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 10,
        boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
        padding: '20px 22px',
        marginBottom: 24,
      }}
    >
      <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#333', marginBottom: 16 }}>
        {title}
      </h2>
      {data.length > 0 ? (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f0f0f0' }}>
              {columns.map(column => (
                <th
                  key={column.key as string}
                  style={{ padding: '10px', borderBottom: '1px solid #ddd', textAlign: 'left' }}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map(row => (
              <tr key={row.id}>
                {columns.map(column => (
                  <td
                    key={column.key as string}
                    style={{ padding: '10px', borderBottom: '1px solid #eee' }}
                  >
                    {String(row[column.key])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p style={{ color: '#666' }}>{emptyMessage}</p>
      )}
    </div>
  );
};

export default DataTable;

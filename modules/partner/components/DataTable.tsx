import React from 'react';

interface DataTableProps<T> {
  title: string;
  data: T[];
  columns: { key: string; header: string }[];
  emptyMessage: string;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  showActions?: boolean;
}

const DataTable = <T extends { id: React.Key }>({
  title,
  data,
  columns,
  emptyMessage,
  onEdit,
  onDelete,
  showActions = false,
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
                  key={column.key}
                  style={{ padding: '10px', borderBottom: '1px solid #ddd', textAlign: 'left' }}
                >
                  {column.header}
                </th>
              ))}
              {showActions && (
                <th style={{ padding: '10px', borderBottom: '1px solid #ddd', textAlign: 'left' }}>
                  Ações
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {data.map(row => (
              <tr key={row.id}>
                {columns.map(column => (
                  <td key={column.key} style={{ padding: '10px', borderBottom: '1px solid #eee' }}>
                    {String((row as any)[column.key])}
                  </td>
                ))}
                {showActions && (
                  <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>
                    {onEdit && (
                      <button
                        onClick={() => onEdit(row)}
                        style={{
                          marginRight: '8px',
                          padding: '4px 8px',
                          background: '#007bff',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                        }}
                      >
                        Editar
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => onDelete(row)}
                        style={{
                          padding: '4px 8px',
                          background: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                        }}
                      >
                        Deletar
                      </button>
                    )}
                  </td>
                )}
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

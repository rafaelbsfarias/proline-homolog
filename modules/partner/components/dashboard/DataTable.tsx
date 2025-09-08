import React, { useState } from 'react';
import { FaEdit } from 'react-icons/fa';
import { TbTrashXFilled } from 'react-icons/tb';
import { FaClipboardList } from 'react-icons/fa';
import ConfirmDialog from '@/modules/admin/components/ConfirmDialog';

interface DataTableProps<T> {
  title: string;
  data: T[];
  columns: { key: keyof T; header: string }[];
  emptyMessage: string;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  onChecklist?: (item: T) => void;
  showActions?: boolean;
}

const DataTable = <T extends { id: React.Key }>({
  title,
  data,
  columns,
  emptyMessage,
  onEdit,
  onDelete,
  onChecklist,
  showActions = false,
}: DataTableProps<T>) => {
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<T | null>(null);

  const handleDeleteClick = (item: T) => {
    setItemToDelete(item);
    setConfirmDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (itemToDelete && onDelete) {
      onDelete(itemToDelete);
    }
    setConfirmDialogOpen(false);
    setItemToDelete(null);
  };

  const handleCancelDelete = () => {
    setConfirmDialogOpen(false);
    setItemToDelete(null);
  };
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
              {showActions && (
                <th
                  style={{
                    padding: '10px',
                    borderBottom: '1px solid #ddd',
                    textAlign: 'center',
                    width: '120px',
                  }}
                >
                  Ações
                </th>
              )}
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
                {showActions && (
                  <td
                    style={{ padding: '10px', borderBottom: '1px solid #eee', textAlign: 'center' }}
                  >
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      {onChecklist && (
                        <button
                          onClick={() => onChecklist(row)}
                          style={{
                            padding: '4px 8px',
                            background: '#10b981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                          title="Checklist"
                        >
                          <FaClipboardList size={14} />
                        </button>
                      )}
                      {onEdit && (
                        <button
                          onClick={() => onEdit(row)}
                          style={{
                            padding: '4px 8px',
                            background: '#002e4c',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                          title="Editar"
                        >
                          <FaEdit size={14} />
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => handleDeleteClick(row)}
                          style={{
                            padding: '4px 8px',
                            background: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                          title="Excluir"
                        >
                          <TbTrashXFilled size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p style={{ color: '#666' }}>{emptyMessage}</p>
      )}
      <ConfirmDialog
        open={confirmDialogOpen}
        title="Excluir Serviço"
        description="Tem certeza que deseja excluir este serviço? Esta ação não pode ser desfeita."
        confirmText="Excluir"
        cancelText="Cancelar"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </div>
  );
};

export default DataTable;

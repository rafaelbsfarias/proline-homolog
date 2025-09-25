import React from 'react';
import styles from './ClientTable.module.css';

interface Client {
  client_id: string;
  client_full_name: string;
  vehicle_count: number;
}

interface ClientTableProps {
  clients: Client[];
  selectedClientId: string | null;
  onSelectClient: (clientId: string) => void;
}

const ClientTable: React.FC<ClientTableProps> = ({ clients, selectedClientId, onSelectClient }) => {
  return (
    <table className={styles.table}>
      <thead>
        <tr className={styles.headerRow}>
          <th className={styles.headerCell}>Cliente</th>
          <th className={styles.headerCellCenter}>Total de Veículos</th>
          <th className={styles.headerCellCenter}>Ações</th>
        </tr>
      </thead>
      <tbody>
        {clients.map(client => (
          <tr key={client.client_id} className={styles.bodyRow}>
            <td className={styles.cell}>{client.client_full_name}</td>
            <td className={styles.cellCenter}>{client.vehicle_count}</td>
            <td className={styles.cellCenter}>
              <button
                type="button"
                onClick={() => onSelectClient(client.client_id)}
                className={`${styles.button} ${selectedClientId === client.client_id ? styles.buttonSelected : ''}`}
                aria-expanded={selectedClientId === client.client_id}
                aria-controls={`vehicles-${client.client_id}`}
              >
                {selectedClientId === client.client_id ? 'Ocultar veículos' : 'Ver veículos'}
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default ClientTable;

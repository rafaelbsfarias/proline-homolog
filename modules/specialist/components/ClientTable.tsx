import React from 'react';

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
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr style={{ background: '#f0f0f0' }}>
          <th style={{ padding: '10px', textAlign: 'left' }}>Cliente</th>
          <th style={{ padding: '10px', textAlign: 'center' }}>Total de Veículos</th>
          <th style={{ padding: '10px', textAlign: 'center' }}>Ações</th>
        </tr>
      </thead>
      <tbody>
        {clients.map(client => (
          <tr key={client.client_id} style={{ borderBottom: '1px solid #eee' }}>
            <td style={{ padding: '10px', textAlign: 'left' }}>{client.client_full_name}</td>
            <td style={{ padding: '10px', textAlign: 'center' }}>{client.vehicle_count}</td>
            <td style={{ padding: '10px', textAlign: 'center' }}>
              <button
                type="button"
                onClick={() => onSelectClient(client.client_id)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 6,
                  border: '1px solid #ccc',
                  background: selectedClientId === client.client_id ? '#e8f0fe' : '#fafafa',
                  cursor: 'pointer',
                }}
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

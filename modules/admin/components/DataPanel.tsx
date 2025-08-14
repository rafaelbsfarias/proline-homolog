'use client';

import React, { useEffect, useState } from 'react';
import AddSpecialistToClientModal from './AddSpecialistToClientModal';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';
import styles from './DataPanel.module.css';
import containerStyles from './DataPanelContainer.module.css';

interface ClientVehicleCount {
  id: string;
  full_name: string;
  vehicle_count: number | null;
}

const DataPanel: React.FC = () => {
  const [clients, setClients] = useState<ClientVehicleCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<{ id: string; full_name: string } | null>(
    null
  );

  const { get } = useAuthenticatedFetch();
  interface ClientsWithVehicleCountResponse {
    success: boolean;
    clients: ClientVehicleCount[];
    error?: string;
  }
  useEffect(() => {
    let isMounted = true;
    async function fetchData() {
      setLoading(true);
      setError(null);
      const response = await get<ClientsWithVehicleCountResponse>(
        '/api/admin/clients-with-vehicle-count'
      );
      if (!isMounted) return;
      if (response.ok && response.data?.success) {
        setClients(response.data.clients);
      } else {
        setError(response.data?.error || response.error || 'Erro ao buscar dados');
      }
      setLoading(false);
    }
    fetchData();
    return () => {
      isMounted = false;
    };
  }, [get]);

  return (
    <div className={containerStyles.dataPanelOuter}>
      <div className={styles.dataPanelCard}>
        {loading ? (
          <p className={styles.placeholderText}>Carregando...</p>
        ) : error ? (
          <p className={styles.placeholderText}>{error}</p>
        ) : clients.length === 0 ? (
          <p className={styles.placeholderText}>Nenhum cliente encontrado.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '8px' }}>Cliente</th>
                <th style={{ textAlign: 'center', padding: '8px' }}>Veículos cadastrados</th>
                <th style={{ width: 40 }}></th>
              </tr>
            </thead>
            <tbody>
              {clients.map(client => (
                <tr key={client.id}>
                  <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
                    {client.full_name}
                  </td>
                  <td
                    style={{ textAlign: 'center', padding: '8px', borderBottom: '1px solid #eee' }}
                  >
                    {client.vehicle_count ?? '-'}
                  </td>
                  <td style={{ textAlign: 'center', borderBottom: '1px solid #eee' }}>
                    <button
                      title="Vincular especialista"
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: 20,
                        color: '#072E4C',
                        padding: 0,
                        margin: 0,
                        lineHeight: 1,
                      }}
                      onClick={() => {
                        setSelectedClient({ id: client.id, full_name: client.full_name });
                        setModalOpen(true);
                      }}
                    >
                      <span aria-label="Adicionar especialista" role="img">
                        ＋
                      </span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <AddSpecialistToClientModal
        isOpen={modalOpen}
        clientId={selectedClient?.id || ''}
        clientName={selectedClient?.full_name || ''}
        onClose={() => setModalOpen(false)}
        onSuccess={() => setModalOpen(false)}
      />
    </div>
  );
};

export default DataPanel;

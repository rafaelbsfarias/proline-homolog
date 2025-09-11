'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import CollectionRequestsModal from './CollectionRequestsModal';
import AddSpecialistToClientModal from './AddSpecialistToClientModal';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';
import styles from './DataPanel.module.css';
import containerStyles from './DataPanelContainer.module.css';

interface ClientVehicleCount {
  id: string;
  full_name: string; // Keeping full_name for potential use, but company_name will be displayed
  company_name: string; // New field
  vehicle_count: number | null;
  specialist_names: string | null; // New field
  collection_requests_count: number | null; // New field for collection requests
}

interface DataPanelProps {
  onLoadingChange?: (loading: boolean) => void;
}

const DataPanel: React.FC<DataPanelProps> = ({ onLoadingChange }) => {
  const [clients, setClients] = useState<ClientVehicleCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [specialistModalOpen, setSpecialistModalOpen] = useState(false);
  const [selectedClientForSpecialistModal, setSelectedClientForSpecialistModal] = useState<{
    id: string;
    full_name: string;
  } | null>(null);
  const [collectionModalOpen, setCollectionModalOpen] = useState(false);
  const [selectedClientForCollectionModal, setSelectedClientForCollectionModal] = useState<{
    id: string;
    full_name: string;
  } | null>(null);

  const { get } = useAuthenticatedFetch();
  interface ClientsWithCollectionSummaryResponse {
    success: boolean;
    clients: ClientVehicleCount[];
    error?: string;
  }

  useEffect(() => {
    onLoadingChange?.(loading);
  }, [loading, onLoadingChange]);
  useEffect(() => {
    let isMounted = true;
    async function fetchData() {
      setLoading(true);
      setError(null);
      // Use aggregated endpoint with vehicle counts + collection requests summary
      const response = await get<ClientsWithCollectionSummaryResponse>(
        '/api/admin/clients-with-collection-summary'
      );
      if (!isMounted) return;
      if (response.ok && response.data?.success) {
        const sorted = [...(response.data.clients || [])].sort((a, b) => {
          const ac = a.collection_requests_count ?? 0;
          const bc = b.collection_requests_count ?? 0;
          if (bc !== ac) return bc - ac;
          const av = a.vehicle_count ?? 0;
          const bv = b.vehicle_count ?? 0;
          return bv - av;
        });
        setClients(sorted);
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
                <th style={{ textAlign: 'left', padding: '8px' }}>Empresa</th>
                <th style={{ textAlign: 'center', padding: '8px' }}>Veículos cadastrados</th>
                <th style={{ textAlign: 'center', padding: '8px' }}>Coleta</th>
                <th style={{ textAlign: 'left', padding: '8px' }}>Especialista(s)</th>
                <th style={{ width: 40 }}></th>
              </tr>
            </thead>
            <tbody>
              {clients.map(client => (
                <tr key={client.id}>
                  <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
                    <Link
                      href={`/admin/clients/${client.id}/overview`}
                      style={{ color: '#072E4C', textDecoration: 'underline' }}
                      title="Ver visão geral do cliente"
                    >
                      {client.company_name}
                    </Link>
                  </td>
                  <td
                    style={{ textAlign: 'center', padding: '8px', borderBottom: '1px solid #eee' }}
                  >
                    {client.vehicle_count ?? '-'}
                  </td>
                  <td
                    style={{ textAlign: 'center', padding: '8px', borderBottom: '1px solid #eee' }}
                  >
                    {client.collection_requests_count && client.collection_requests_count > 0 ? (
                      <button
                        title="Ver solicitações de coleta"
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: 16,
                          fontWeight: 'bold',
                          color: '#007bff',
                          padding: 0,
                          margin: 0,
                          lineHeight: 1,
                        }}
                        onClick={() => {
                          setSelectedClientForCollectionModal({
                            id: client.id,
                            full_name: (client as any).company_name || client.full_name,
                          });
                          setCollectionModalOpen(true);
                        }}
                      >
                        {client.collection_requests_count}
                      </button>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
                    {client.specialist_names || 'Nenhum'}
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
                        setSelectedClientForSpecialistModal({
                          id: client.id,
                          full_name: client.full_name,
                        });
                        setSpecialistModalOpen(true);
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
        isOpen={specialistModalOpen}
        clientId={selectedClientForSpecialistModal?.id || ''}
        clientName={selectedClientForSpecialistModal?.full_name || ''}
        onClose={() => setSpecialistModalOpen(false)}
        onSuccess={() => setSpecialistModalOpen(false)}
      />
      <CollectionRequestsModal
        isOpen={collectionModalOpen}
        clientId={selectedClientForCollectionModal?.id || ''}
        clientName={selectedClientForCollectionModal?.full_name || ''}
        onClose={() => setCollectionModalOpen(false)}
        onSuccess={() => setCollectionModalOpen(false)}
      />
    </div>
  );
};

export default DataPanel;

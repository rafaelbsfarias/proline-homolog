import React, { useState, useEffect, useCallback } from 'react';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';
import MessageModal from '@/modules/common/components/MessageModal';
import CurrencyInput from '@/modules/common/components/CurrencyInput';
import styles from './CollectionRequestsModal.module.css';

type CollectionGroup = {
  id: string; // addressId
  address: string;
  vehicle_count: number;
  current_fee: number | null;
};

interface CollectionRequestsModalProps {
  isOpen: boolean;
  clientId: string;
  clientName: string;
  onClose: () => void;
  onSuccess?: () => void;
}

const CollectionRequestsModal: React.FC<CollectionRequestsModalProps> = ({
  isOpen,
  clientId,
  clientName,
  onClose,
  onSuccess,
}) => {
  const { get } = useAuthenticatedFetch();
  const [collectionRequests, setCollectionRequests] = useState<CollectionGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [fees, setFees] = useState<Record<string, number | undefined>>({});

  const fetchCollectionRequests = useCallback(async () => {
    if (!clientId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await get<{ success: boolean; groups: { addressId: string; address: string; vehicle_count: number; collection_fee: number | null }[]; error?: string }>(`/api/admin/client-collections-summary/${clientId}`);
      if (response.ok && response.data?.success) {
        ((() => { const groups = (response.data.groups || []).map(g => ({ id: g.addressId, address: g.address, vehicle_count: g.vehicle_count, current_fee: g.collection_fee })); setCollectionRequests(groups); const initialFees: Record<string, number | undefined> = {}; groups.forEach(req => { initialFees[req.id] = req.current_fee ?? undefined; }); setFees(initialFees); })())
      } else {
        setError(response.data?.error || response.error || 'Erro ao buscar solicitações de coleta');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido ao buscar solicitações');
    } finally {
      setLoading(false);
    }
  }, [clientId, get]);

  useEffect(() => {
    if (isOpen) {
      fetchCollectionRequests();
      setMessage(null);
    }
  }, [isOpen, fetchCollectionRequests]);

  const handleFeeChange = (collectionId: string, value: number | undefined) => {
    setFees(prev => ({
      ...prev,
      [collectionId]: value,
    }));
  };

  /* removed handleSubmitFees (no persistence for address-based fees yet) */

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <button className={styles.closeButton} onClick={onClose}>
          &times;
        </button>
        <h2>Solicitações de Coleta para {clientName}</h2>

        {loading ? (
          <p>Carregando solicitações...</p>
        ) : error ? (
          <p className={styles.error}>{error}</p>
        ) : collectionRequests.length === 0 ? (
          <p>Nenhuma solicitação de coleta pendente para este cliente.</p>
        ) : (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Ponto de coleta</th>
                  <th>Veículos</th>
                  <th>Valor da coleta (R$)</th>
                </tr>
              </thead>
              <tbody>
                {collectionRequests.map(req => (
                  <tr key={req.id}>
                    <td>{req.address}</td>
                    <td>{req.vehicle_count}</td>
                    <td>
                      {fees[req.id] !== undefined ? fees[req.id]!.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className={styles.actions}>
          <button onClick={onClose} disabled={loading}>
            Fechar
          </button>
        </div>

        {message && <MessageModal message={message} onClose={() => setMessage(null)} variant="success" />}
      </div>
    </div>
  );
};

export default CollectionRequestsModal;

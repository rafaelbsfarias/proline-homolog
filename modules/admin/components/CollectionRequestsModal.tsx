import React, { useState, useEffect, useCallback } from 'react';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';
import MessageModal from '@/modules/common/components/MessageModal';
import CurrencyInput from '@/modules/common/components/CurrencyInput';
import styles from './CollectionRequestsModal.module.css';

interface CollectionRequest {
  id: string;
  address: string;
  vehicle_count: number;
  current_fee: number | null;
  status: string;
}

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
  const { get, post } = useAuthenticatedFetch();
  const [collectionRequests, setCollectionRequests] = useState<CollectionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [fees, setFees] = useState<Record<string, number | undefined>>({});

  const fetchCollectionRequests = useCallback(async () => {
    if (!clientId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await get<{ success: boolean; collectionRequests: CollectionRequest[]; error?: string }>(`/api/admin/collection-requests/${clientId}`);
      if (response.ok && response.data?.success) {
        setCollectionRequests(response.data.collectionRequests);
        // Initialize fees state with current_fee values
        const initialFees: Record<string, number | undefined> = {};
        response.data.collectionRequests.forEach(req => {
          initialFees[req.id] = req.current_fee ?? undefined;
        });
        setFees(initialFees);
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

  const handleSubmitFees = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      for (const collectionRequest of collectionRequests) {
        const newFee = fees[collectionRequest.id];
        // Only send update if fee has changed or is being set for the first time
        if (newFee !== undefined && newFee !== collectionRequest.current_fee) {
          const response = await post('/api/admin/set-collection-fee', {
            collectionId: collectionRequest.id,
            collectionFeePerVehicle: newFee,
          });
          if (!response.ok) {
            throw new Error(response.error || `Erro ao salvar valor para ${collectionRequest.address}`);
          }
        }
      }
      setMessage('Valores de coleta atualizados com sucesso!');
      fetchCollectionRequests(); // Re-fetch to update current_fee values
      onSuccess?.();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido ao salvar valores');
    } finally {
      setLoading(false);
    }
  };

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
                      <CurrencyInput
                        value={fees[req.id]}
                        onChange={value => handleFeeChange(req.id, value)}
                        placeholder="0,00"
                        disabled={loading}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className={styles.actions}>
          <button onClick={handleSubmitFees} disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar Valores'}
          </button>
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

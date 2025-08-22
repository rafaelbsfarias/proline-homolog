'use client';

import React, { useState } from 'react';
import './CollectionApprovalCard.css';
import { useCollectionApprovals } from '../hooks/useCollectionApprovals';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';

const CollectionApprovalCard = () => {
  const { collections, loading, error, refetch } = useCollectionApprovals();
  const { post } = useAuthenticatedFetch();
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

  const handleAction = async (action: 'approve' | 'reject', collectionId: string) => {
    setActionLoading(prev => ({ ...prev, [collectionId]: true }));
    try {
      const endpoint = `/api/client/${action}-collection`;
      const res = await post(endpoint, { collection_id: collectionId });
      if (!res.ok) {
        throw new Error(res.error || `Erro ao ${action}r a coleta`);
      }
      refetch(); // Refresh the list after action
    } catch (e) {
   
      console.error(e);
    } finally {
      setActionLoading(prev => ({ ...prev, [collectionId]: false }));
    }
  };

  const formatCurrency = (value: number | null) => {
    if (value === null || value === undefined) return 'N/A';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR').format(date);
  };

  if (loading) {
    return <div className="loading-state">Carregando coletas para aprovação...</div>;
  }

  if (error) {
    return <div className="error-state">Erro ao carregar coletas: {error}</div>;
  }

  if (collections.length === 0) {
    return null; // Do not render the card if there are no collections to approve
  }

  return (
    <div className="collection-approval-card">
      <h2 className="collection-approval-title">Coleta de Veículos</h2>
      {collections.map((collection) => (
        <div key={collection.id} className="collection-item">
          <div className="collection-header">{collection.address}</div>
          <div className="collection-details">
            <div><strong>Data Prevista:</strong> {formatDate(collection.date)}</div>
            <div><strong>Valor por Veículo:</strong> {formatCurrency(collection.fee)}</div>
            <div><strong>Total:</strong> {formatCurrency(collection.fee * collection.vehicles.length)}</div>
          </div>
          <div className="collection-vehicles">
            <strong>Veículos ({collection.vehicles.length}):</strong>
            <div className="collection-vehicles-list">
              {collection.vehicles.map((v) => `${v.brand} ${v.model} (${v.plate})`).join('; ')}
            </div>
          </div>
          <div className="collection-actions">
            <button 
              className="approve-btn" 
              onClick={() => handleAction('approve', collection.id)}
              disabled={actionLoading[collection.id]}
            >
              {actionLoading[collection.id] ? 'Aprovando...' : 'Aprovar Coleta'}
            </button>
            <button 
              className="reject-btn" 
              onClick={() => handleAction('reject', collection.id)}
              disabled={actionLoading[collection.id]}
            >
              {actionLoading[collection.id] ? 'Recusando...' : 'Recusar Coleta'}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CollectionApprovalCard;
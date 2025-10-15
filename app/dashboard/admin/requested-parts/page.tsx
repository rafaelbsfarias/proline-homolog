'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loading } from '@/modules/common/components/Loading/Loading';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';
import { useAuth } from '@/modules/common/services/AuthProvider';
import styles from './RequestedPartsPage.module.css';

interface PartRequest {
  id: string;
  part_name: string;
  part_description: string | null;
  quantity: number;
  estimated_price: string | null;
  purchase_link: string | null;
  status: string;
  created_at: string;
  anomaly_id: string;
  estimated_delivery_date: string | null;
  actual_delivery_date: string | null;
  vehicle_anomalies: {
    vehicles: {
      plate: string;
    };
  };
}

interface EditingState {
  id: string;
  part_description: string;
  estimated_price: string;
  purchase_link: string;
  status: string;
}

const RequestedPartsPage: React.FC = () => {
  const router = useRouter();
  const { get, authenticatedFetch } = useAuthenticatedFetch();
  const { user } = useAuth();
  const [partRequests, setPartRequests] = useState<PartRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<EditingState | null>(null);
  const [saving, setSaving] = useState(false);
  const [plateFilter, setPlateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Determinar o papel do usuário
  const rawRole = (user?.user_metadata?.role as string | undefined) || 'specialist';
  const userRole: 'client' | 'specialist' | 'admin' | 'partner' =
    rawRole === 'client'
      ? 'client'
      : rawRole === 'admin'
        ? 'admin'
        : rawRole === 'partner'
          ? 'partner'
          : 'specialist';

  // Verificar se o usuário pode ver as colunas de entrega
  const canViewDeliveryColumns = userRole === 'admin' || userRole === 'specialist';

  // Verificar se o usuário pode editar
  const canEdit = userRole === 'admin' || userRole === 'specialist';

  useEffect(() => {
    const fetchPartRequests = async () => {
      setLoading(true);
      setError(null);
      try {
        // Usar API diferente baseada no papel do usuário
        const apiEndpoint =
          userRole === 'specialist'
            ? '/api/specialist/part-requests/list'
            : '/api/admin/part-requests/list';

        const response = await get<{ data: PartRequest[]; error?: string }>(apiEndpoint);
        if (response.ok && response.data?.data) {
          setPartRequests(response.data.data);
        } else {
          setError(response.data?.error || 'Erro ao buscar peças solicitadas');
        }
      } catch {
        setError('Erro ao buscar peças solicitadas');
      }
      setLoading(false);
    };

    fetchPartRequests();
  }, [get, userRole]);

  const formatCurrency = (value: string | null) => {
    if (!value) return 'N/A';
    const numValue = parseFloat(value);
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(numValue);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pendente';
      case 'approved':
        return 'Aprovado';
      case 'ordered':
        return 'Compra Realizada';
      case 'received':
        return 'Recebido';
      case 'rejected':
        return 'Rejeitado';
      default:
        return status;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'pending':
        return styles.statusPending;
      case 'approved':
        return styles.statusApproved;
      case 'ordered':
        return styles.statusOrdered;
      case 'received':
        return styles.statusReceived;
      case 'rejected':
        return styles.statusRejected;
      default:
        return styles.statusDefault;
    }
  };

  const handleEdit = (request: PartRequest) => {
    setEditingId(request.id);
    setEditingData({
      id: request.id,
      part_description: request.part_description || '',
      estimated_price: request.estimated_price || '',
      purchase_link: request.purchase_link || '',
      status: request.status,
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingData(null);
  };

  const handleSaveEdit = async () => {
    if (!editingData) return;

    setSaving(true);
    try {
      // Verificar se o status está mudando para "ordered" para definir data estimada
      const currentRequest = partRequests.find(req => req.id === editingData.id);
      const isChangingToOrdered =
        currentRequest?.status !== 'ordered' && editingData.status === 'ordered';
      const estimatedDeliveryDate = isChangingToOrdered
        ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        : undefined;

      const response = await authenticatedFetch(`/api/admin/part-requests/${editingData.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          part_description: editingData.part_description || null,
          estimated_price: editingData.estimated_price
            ? parseFloat(editingData.estimated_price)
            : null,
          purchase_link: editingData.purchase_link || null,
          status: editingData.status,
          ...(estimatedDeliveryDate && { estimated_delivery_date: estimatedDeliveryDate }),
        }),
      });

      if (response.ok) {
        // Atualizar a lista local
        setPartRequests(prev =>
          prev.map(req =>
            req.id === editingData.id
              ? {
                  ...req,
                  ...editingData,
                  estimated_price: editingData.estimated_price || null,
                  purchase_link: editingData.purchase_link || null,
                  ...(estimatedDeliveryDate && { estimated_delivery_date: estimatedDeliveryDate }),
                }
              : req
          )
        );
        setEditingId(null);
        setEditingData(null);
      } else {
        setError('Erro ao salvar alterações');
      }
    } catch {
      setError('Erro ao salvar alterações');
    }
    setSaving(false);
  };

  const handleInputChange = (field: keyof EditingState, value: string) => {
    if (!editingData) return;
    setEditingData(prev => (prev ? { ...prev, [field]: value } : null));
  };

  // Filtrar as solicitações baseado nos filtros aplicados
  const filteredPartRequests = partRequests.filter(request => {
    const matchesPlate =
      !plateFilter ||
      request.vehicle_anomalies?.vehicles?.plate?.toLowerCase().includes(plateFilter.toLowerCase());
    const matchesStatus = !statusFilter || request.status === statusFilter;
    return matchesPlate && matchesStatus;
  });

  if (loading) {
    return (
      <div className={styles.container}>
        <Loading />
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorContainer}>
          <h1 className={styles.errorTitle}>Erro</h1>
          <p>{error}</p>
          <button onClick={() => router.back()} className={styles.errorButton}>
            Voltar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <Link
            href="/dashboard"
            style={{
              display: 'inline-block',
              marginBottom: '16px',
              color: '#3498db',
              textDecoration: 'none',
              fontSize: '0.875rem',
            }}
          >
            ← Voltar
          </Link>
        </div>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Peças Solicitadas</h1>
          <p className={styles.subtitle}>{filteredPartRequests.length} solicitações encontradas</p>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Filtrar por Placa:</label>
          <input
            type="text"
            value={plateFilter}
            onChange={e => setPlateFilter(e.target.value)}
            placeholder="Digite a placa..."
            className={styles.filterInput}
          />
        </div>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Filtrar por Status:</label>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="">Todos os status</option>
            <option value="pending">Pendente</option>
            <option value="approved">Aprovado</option>
            <option value="ordered">Compra Realizada</option>
            <option value="received">Recebido</option>
            <option value="rejected">Rejeitado</option>
          </select>
        </div>
        {(plateFilter || statusFilter) && (
          <button
            onClick={() => {
              setPlateFilter('');
              setStatusFilter('');
            }}
            className={styles.clearFiltersButton}
          >
            Limpar Filtros
          </button>
        )}
      </div>

      {/* Content */}
      <div className={styles.content}>
        {partRequests.length === 0 ? (
          <div className={styles.emptyState}>
            <h2>Nenhuma solicitação de peça encontrada</h2>
            <p>Não há solicitações de peças pendentes no momento.</p>
          </div>
        ) : (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Peça</th>
                  <th>Descrição</th>
                  <th>Quantidade</th>
                  <th>Preço</th>
                  <th>Placa do Veículo</th>
                  {canViewDeliveryColumns && <th>Link de Compra</th>}
                  <th>Status</th>
                  <th>Data da Solicitação</th>
                  {canViewDeliveryColumns && <th>Previsão de Entrega</th>}
                  {canViewDeliveryColumns && <th>Data da Entrega</th>}
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredPartRequests.map(request => (
                  <tr key={request.id}>
                    <td className={styles.partName}>{request.part_name}</td>
                    <td className={styles.description}>
                      {editingId === request.id ? (
                        <input
                          type="text"
                          value={editingData?.part_description || ''}
                          onChange={e => handleInputChange('part_description', e.target.value)}
                          className={styles.editInput}
                        />
                      ) : (
                        request.part_description || 'Sem descrição'
                      )}
                    </td>
                    <td className={styles.quantity}>{request.quantity}</td>
                    <td className={styles.price}>
                      {editingId === request.id ? (
                        <input
                          type="number"
                          step="0.01"
                          value={editingData?.estimated_price || ''}
                          onChange={e => handleInputChange('estimated_price', e.target.value)}
                          className={styles.editInput}
                        />
                      ) : (
                        formatCurrency(request.estimated_price)
                      )}
                    </td>
                    <td className={styles.plate}>
                      {request.vehicle_anomalies?.vehicles?.plate || 'N/A'}
                    </td>
                    {canViewDeliveryColumns && (
                      <td className={styles.link}>
                        {editingId === request.id ? (
                          <input
                            type="url"
                            value={editingData?.purchase_link || ''}
                            onChange={e => handleInputChange('purchase_link', e.target.value)}
                            placeholder="https://..."
                            className={styles.editInput}
                          />
                        ) : request.purchase_link ? (
                          <a
                            href={request.purchase_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.purchaseLink}
                          >
                            Ver produto
                          </a>
                        ) : (
                          'Não informado'
                        )}
                      </td>
                    )}
                    <td>
                      {editingId === request.id ? (
                        <select
                          value={editingData?.status || ''}
                          onChange={e => handleInputChange('status', e.target.value)}
                          className={styles.editSelect}
                        >
                          <option value="pending">Pendente</option>
                          <option value="approved">Aprovado</option>
                          <option value="ordered">Compra Realizada</option>
                          <option value="received">Recebido</option>
                          <option value="rejected">Rejeitado</option>
                        </select>
                      ) : (
                        <span className={`${styles.status} ${getStatusClass(request.status)}`}>
                          {getStatusLabel(request.status)}
                        </span>
                      )}
                    </td>
                    <td className={styles.date}>{formatDate(request.created_at)}</td>
                    {canViewDeliveryColumns && (
                      <td className={styles.date}>
                        {request.estimated_delivery_date
                          ? formatDate(request.estimated_delivery_date)
                          : 'Não definida'}
                      </td>
                    )}
                    {canViewDeliveryColumns && (
                      <td className={styles.date}>
                        {request.actual_delivery_date
                          ? formatDate(request.actual_delivery_date)
                          : 'Não definida'}
                      </td>
                    )}
                    <td>
                      {editingId === request.id ? (
                        <div className={styles.editActions}>
                          <button
                            onClick={handleSaveEdit}
                            disabled={saving}
                            className={styles.saveButton}
                          >
                            {saving ? 'Salvando...' : 'Salvar'}
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            disabled={saving}
                            className={styles.cancelButton}
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : canEdit ? (
                        <button onClick={() => handleEdit(request)} className={styles.editButton}>
                          Editar
                        </button>
                      ) : (
                        <span className={styles.readOnlyText}>Somente leitura</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default RequestedPartsPage;

import React, { useState, useEffect, useCallback } from 'react';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';
import MessageModal from '@/modules/common/components/MessageModal';
import CurrencyInput from '@/modules/common/components/CurrencyInput';
import styles from './CollectionRequestsModal.module.css';
import { getLogger } from '@/modules/logger/logger';


type CollectionGroup = {
  id: string; // addressId
  address: string;
  vehicle_count: number;
  current_fee: number | null;
};

type ApprovalGroup = CollectionGroup & { statuses?: { status: string; count: number }[] };

interface CollectionRequestsModalProps {
  isOpen: boolean;
  clientId: string;
  clientName: string;
  onClose: () => void;
  onSuccess?: () => void;
}

const logger = getLogger('CollectionRequestsModal');

const CollectionRequestsModal: React.FC<CollectionRequestsModalProps> = ({
  isOpen,
  clientId,
  clientName,
  onClose,
  onSuccess,
}) => {
  const { get, post } = useAuthenticatedFetch();
  const [collectionRequests, setCollectionRequests] = useState<CollectionGroup[]>([]);
  const [approvalGroups, setApprovalGroups] = useState<ApprovalGroup[]>([]);
  const [approvalTotal, setApprovalTotal] = useState<number>(0);
  const [clientSummary, setClientSummary] = useState<{ taxa_operacao?: number; percentual_fipe?: number } | null>(null);
  const [statusTotals, setStatusTotals] = useState<{ status: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [fees, setFees] = useState<Record<string, number | undefined>>({});

  const fetchCollectionRequests = useCallback(async () => {
    if (!clientId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await get<{ success: boolean; groups: { addressId: string; address: string; vehicle_count: number; collection_fee: number | null }[]; approvalGroups?: { addressId: string; address: string; vehicle_count: number; collection_fee: number | null; statuses?: { status: string; count: number }[] }[]; approvalTotal?: number; clientSummary?: { taxa_operacao?: number; percentual_fipe?: number }; statusTotals?: { status: string; count: number }[]; error?: string }>(`/api/admin/client-collections-summary/${clientId}`);
      logger.info('API response', response);
      if (response.ok && response.data?.success) {
        ((() => {
          const groups = (response.data.groups || []).map(g => ({ id: g.addressId, address: g.address, vehicle_count: g.vehicle_count, current_fee: g.collection_fee }));
          logger.debug('Groups', groups);
          setCollectionRequests(groups);
          const initialFees: Record<string, number | undefined> = {};
          groups.forEach(req => { initialFees[req.id] = req.current_fee ?? undefined; });
          setFees(initialFees);
          const ag = (response.data.approvalGroups || []).map(g => ({ id: g.addressId, address: g.address, vehicle_count: g.vehicle_count, current_fee: g.collection_fee, statuses: g.statuses }));
          logger.debug('ApprovalGroups', ag);
          setApprovalGroups(ag);
          logger.debug('ApprovalTotal', response.data.approvalTotal);
          setApprovalTotal(response.data.approvalTotal || 0);
          logger.debug('ClientSummary', response.data.clientSummary);
          setClientSummary(response.data.clientSummary || null);
          logger.debug('StatusTotals', response.data.statusTotals);
          setStatusTotals(response.data.statusTotals || []);
        })())
      } else {
        logger.error('API error', response.data?.error || response.error);
        setError(response.data?.error || response.error || 'Erro ao buscar solicitações de coleta');
      }
    } catch (err: unknown) {
      logger.error('Exception in fetchCollectionRequests', err);
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
    try {
      setLoading(true);
      setError(null);
      setMessage(null);
      const payload = {
        clientId,
        fees: collectionRequests
          .map(req => ({ addressId: req.id, fee: fees[req.id] }))
          .filter((x): x is { addressId: string; fee: number } => typeof x.fee === 'number'),
      };
      const resp = await post('/api/admin/set-address-collection-fees', payload);
      if (!resp.ok) throw new Error(resp.error || 'Erro ao salvar valores');
      setMessage('Valores de coleta atualizados com sucesso!');
      await fetchCollectionRequests();
      onSuccess?.();
    } catch (e: any) {
      setError(e?.message || 'Erro ao salvar valores');
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
        <h2>Visão geral da {clientName}</h2>

        <p style={{ marginTop: 4, color: "#555" }}>Defina os valores de coleta por ponto abaixo.</p>
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Ponto de coleta</th>
                <th>Veículos</th>
                <th>Valor da coleta (R$)</th>
                <th>Total estimado (R$)</th>
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
                  <td>
                    {typeof fees[req.id] === 'number' ? (fees[req.id]! * (req.vehicle_count || 0)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3} style={{ textAlign: 'right', fontWeight: 600 }}>Total estimado geral:</td>
                <td style={{ fontWeight: 700 }}>{collectionRequests.reduce((acc, r) => acc + ((typeof fees[r.id] === 'number') ? (fees[r.id]! * (r.vehicle_count || 0)) : 0), 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
              </tr>
            </tfoot>
          </table>
        </div>
        <div className={styles.tableContainer}>
          <h3 style={{ marginTop: 16 }}>Resumo da coleta (aguardando aprovação)</h3>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Ponto de coleta</th>
                <th>Veículos</th>
                <th>Status</th>
                <th>Valor por endereço (R$)</th>
                <th>Total por endereço (R$)</th>
              </tr>
            </thead>
            <tbody>
              {approvalGroups.map(g => (
                <tr key={g.id}>
                  <td>{g.address}</td>
                  <td>{g.vehicle_count}</td>
                  <td>{(g.statuses || []).map(s => `${s.status} (${s.count})`).join(", ") || "-"}</td>
                  <td>{typeof g.current_fee === "number" ? g.current_fee.toLocaleString('pt-BR', { style: "currency", currency: "BRL" }) : "-"}</td>
                  <td>{typeof g.current_fee === "number" ? (g.current_fee * (g.vehicle_count || 0)).toLocaleString('pt-BR', { style: "currency", currency: "BRL" }) : "-"}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={4} style={{ textAlign: "right", fontWeight: 600 }}>Total geral da coleta:</td>
                <td style={{ fontWeight: 700 }}>{approvalTotal.toLocaleString('pt-BR', { style: "currency", currency: "BRL" })}</td>
              </tr>
            </tfoot>
          </table>
        </div>
        <div style={{ marginTop: 16 }}>
          <h3>Resumo do cliente</h3>
          <div style={{ display: 'flex', gap: 24, color: '#333' }}>
            <div><b>Taxa de operação:</b> {typeof clientSummary?.taxa_operacao === 'number' ? clientSummary.taxa_operacao.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'}</div>
            <div><b>Percentual da FIPE:</b> {typeof clientSummary?.percentual_fipe === 'number' ? `${clientSummary.percentual_fipe.toFixed(2)}%` : '-'}</div>
          </div>
        </div>
        <div className={styles.tableContainer}>
          <h3 style={{ marginTop: 16 }}>Status dos veículos</h3>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Status</th>
                <th>Quantidade</th>
              </tr>
            </thead>
            <tbody>
              {statusTotals.map(s => (
                <tr key={s.status}>
                  <td>{s.status}</td>
                  <td>{s.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className={styles.actions}>
          <button onClick={handleSubmitFees} disabled={loading}>
            {loading ? "Salvando..." : "Salvar Valores"}
          </button>
          <button onClick={onClose} disabled={loading}>Fechar</button>
        </div>

        {message && <MessageModal message={message} onClose={() => setMessage(null)} variant="success" />}
      </div>
    </div>
  );
};

export default CollectionRequestsModal;

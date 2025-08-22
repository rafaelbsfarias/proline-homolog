
"use client";
import { useRouter, useParams } from 'next/navigation';
import React, { useState, useEffect, useCallback } from 'react';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';
import CurrencyInput from '@/modules/common/components/CurrencyInput';
import styles from '@/modules/admin/components/CollectionRequestsModal.module.css';

type CollectionGroup = {
  id: string;
  address: string;
  vehicle_count: number;
  current_fee: number | null;
};

type ApprovalGroup = CollectionGroup & { statuses?: { status: string; count: number }[] };

type ClientSummary = { taxa_operacao?: number; percentual_fipe?: number };
type StatusTotal = { status: string; count: number };

type ApiResponse = {
  success?: boolean;
  groups?: Array<{
    addressId: string;
    address: string;
    vehicle_count: number;
    collection_fee: number | null;
  }>;
  approvalGroups?: Array<{
    addressId: string;
    address: string;
    vehicle_count: number;
    collection_fee: number | null;
    statuses?: { status: string; count: number }[];
  }>;
  approvalTotal?: number;
  clientSummary?: ClientSummary;
  statusTotals?: StatusTotal[];
  error?: string;
};

const Page = () => {
  const router = useRouter();
  const params = useParams() as any;
  const id = String(params?.id || "");
  const { get, post } = useAuthenticatedFetch();
  const [collectionRequests, setCollectionRequests] = useState<CollectionGroup[]>([]);
  const [approvalGroups, setApprovalGroups] = useState<ApprovalGroup[]>([]);
  const [approvalTotal, setApprovalTotal] = useState<number>(0);
  const [clientSummary, setClientSummary] = useState<ClientSummary | null>(null);
  const [statusTotals, setStatusTotals] = useState<StatusTotal[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [fees, setFees] = useState<Record<string, number | undefined>>({});

  const fetchCollectionRequests = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const response = await get<ApiResponse>(`/api/admin/client-collections-summary/${id}`);
      if (response.ok && response.data?.success) {
        const groups = (response.data.groups || []).map((g) => ({
          id: g.addressId,
          address: g.address,
          vehicle_count: g.vehicle_count,
          current_fee: g.collection_fee,
        }));
        setCollectionRequests(groups);
        const initialFees: Record<string, number | undefined> = {};
        groups.forEach((req) => {
          initialFees[req.id] = req.current_fee ?? undefined;
        });
        setFees(initialFees);
        const ag = (response.data.approvalGroups || []).map((g) => ({
          id: g.addressId,
          address: g.address,
          vehicle_count: g.vehicle_count,
          current_fee: g.collection_fee,
          statuses: g.statuses,
        }));
        setApprovalGroups(ag);
        setApprovalTotal(response.data.approvalTotal || 0);
        setClientSummary(response.data.clientSummary || null);
        setStatusTotals(response.data.statusTotals || []);
      } else {
        setError(response.data?.error || (response as any).error || 'Erro ao buscar solicitações de coleta');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido ao buscar solicitações');
    } finally {
      setLoading(false);
    }
  }, [id, get]);

  useEffect(() => {
    fetchCollectionRequests();
    setMessage(null);
  }, [id, fetchCollectionRequests]);

  const handleFeeChange = (collectionId: string, value: number | undefined) => {
    setFees((prev) => ({ ...prev, [collectionId]: value }));
  };

  const handleSubmitFees = async () => {
    try {
      setLoading(true);
      setError(null);
      setMessage(null);
      const payload = {
        clientId: id,
        fees: collectionRequests
          .map((req) => ({ addressId: req.id, fee: fees[req.id] }))
          .filter((x): x is { addressId: string; fee: number } => typeof x.fee === 'number'),
      };
      const resp = await post('/api/admin/set-address-collection-fees', payload);
      if (!resp.ok) throw new Error((resp as any).error || 'Erro ao salvar valores');
      setMessage('Valores de coleta atualizados com sucesso!');
      await fetchCollectionRequests();
    } catch (e: any) {
      setError(e?.message || 'Erro ao salvar valores');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.modalContent} style={{ margin: '32px auto', maxWidth: 900 }}>
      <h2>Visão geral do cliente</h2>
      <p style={{ marginTop: 4, color: '#555' }}>Defina os valores de coleta por ponto abaixo.</p>
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
            {collectionRequests.map((req) => (
              <tr key={req.id}>
                <td>{req.address}</td>
                <td>{req.vehicle_count}</td>
                <td>
                  <CurrencyInput
                    value={fees[req.id]}
                    onChange={(value) => handleFeeChange(req.id, value)}
                    placeholder="0,00"
                    disabled={loading}
                  />
                </td>
                <td>
                  {typeof fees[req.id] === 'number'
                    ? (fees[req.id]! * (req.vehicle_count || 0)).toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })
                    : '-'}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3} style={{ textAlign: 'right', fontWeight: 600 }}>Total estimado geral:</td>
              <td style={{ fontWeight: 700 }}>
                {collectionRequests
                  .reduce(
                    (acc, r) =>
                      acc + (typeof fees[r.id] === 'number' ? fees[r.id]! * (r.vehicle_count || 0) : 0),
                    0
                  )
                  .toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </td>
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
            {approvalGroups.map((g) => (
              <tr key={g.id}>
                <td>{g.address}</td>
                <td>{g.vehicle_count}</td>
                <td>{(g.statuses || []).map((s) => `${s.status} (${s.count})`).join(', ') || '-'}</td>
                <td>
                  {typeof g.current_fee === 'number'
                    ? g.current_fee.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                    : '-'}
                </td>
                <td>
                  {typeof g.current_fee === 'number'
                    ? (g.current_fee * (g.vehicle_count || 0)).toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })
                    : '-'}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={4} style={{ textAlign: 'right', fontWeight: 600 }}>Total geral da coleta:</td>
              <td style={{ fontWeight: 700 }}>{approvalTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      <div style={{ marginTop: 16 }}>
        <h3>Resumo do cliente</h3>
        <div style={{ display: 'flex', gap: 24, color: '#333' }}>
          <div>
            <b>Taxa de operação:</b>{' '}
            {typeof clientSummary?.taxa_operacao === 'number'
              ? clientSummary.taxa_operacao.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
              : '-'}
          </div>
          <div>
            <b>Percentual da FIPE:</b>{' '}
            {typeof clientSummary?.percentual_fipe === 'number'
              ? `${clientSummary.percentual_fipe.toFixed(2)}%`
              : '-'}
          </div>
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
            {statusTotals.map((s) => (
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
          {loading ? 'Salvando...' : 'Salvar Valores'}
        </button>
        {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
        {message && <div style={{ color: 'green', marginTop: 8 }}>{message}</div>}
      </div>
    </div>
  );
};

export default Page;

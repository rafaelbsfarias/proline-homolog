
"use client";
import { useRouter, useParams } from 'next/navigation';
import React, { useState, useEffect, useCallback } from 'react';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';
import CurrencyInput from '@/modules/common/components/CurrencyInput';
import styles from './page.module.css';
import Header from '@/modules/admin/components/Header';

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
    <>
      <Header />
      <div className={styles.container}>
        <div className={styles.header}>
          <button className={styles.backButton} onClick={() => router.back()} aria-label="Voltar">← Voltar</button>
          <h1 className={styles.title}>Visão geral do cliente</h1>
        </div>

        <p className={styles.note}>Defina os valores de coleta por ponto abaixo.</p>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.thLeft}>Ponto de coleta</th>
                <th className={styles.thCenter}>Veículos</th>
                <th className={styles.thCenter}>Valor da coleta (R$)</th>
                <th className={styles.thCenter}>Total estimado (R$)</th>
              </tr>
            </thead>
            <tbody>
              {collectionRequests.map((req) => (
                <tr key={req.id}>
                  <td>{req.address}</td>
                  <td className={styles.alignCenter}>{req.vehicle_count}</td>
                  <td className={styles.alignCenter}>
                    <CurrencyInput
                      value={fees[req.id]}
                      onChange={(value) => handleFeeChange(req.id, value)}
                      placeholder="0,00"
                      disabled={loading}
                    />
                  </td>
                  <td className={styles.alignCenter}>
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
                <td colSpan={3} className={styles.alignRight + ' ' + styles.bold}>Total estimado geral:</td>
                <td className={styles.bold}>
                  {collectionRequests
                    .reduce(
                      (acc, r) => acc + (typeof fees[r.id] === 'number' ? fees[r.id]! * (r.vehicle_count || 0) : 0),
                      0
                    )
                    .toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Resumo da coleta (aguardando aprovação)</h2>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.thLeft}>Ponto de coleta</th>
                  <th className={styles.thCenter}>Veículos</th>
                  <th className={styles.thLeft}>Status</th>
                  <th className={styles.thCenter}>Valor por endereço (R$)</th>
                  <th className={styles.thCenter}>Total por endereço (R$)</th>
                </tr>
              </thead>
              <tbody>
                {approvalGroups.map((g) => (
                  <tr key={g.id}>
                    <td>{g.address}</td>
                    <td className={styles.alignCenter}>{g.vehicle_count}</td>
                    <td>{(g.statuses || []).map((s) => `${s.status} (${s.count})`).join(', ') || '-'}</td>
                    <td className={styles.alignCenter}>
                      {typeof g.current_fee === 'number'
                        ? g.current_fee.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                        : '-'}
                    </td>
                    <td className={styles.alignCenter}>
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
                  <td colSpan={4} className={styles.alignRight + ' ' + styles.bold}>Total geral da coleta:</td>
                  <td className={styles.bold}>{approvalTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Resumo do cliente</h2>
          <div className={styles.summaryRow}>
            <div className={styles.summaryItem}><b>Taxa de operação:</b> {typeof clientSummary?.taxa_operacao === 'number' ? clientSummary.taxa_operacao.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'}</div>
            <div className={styles.summaryItem}><b>Percentual da FIPE:</b> {typeof clientSummary?.percentual_fipe === 'number' ? `${clientSummary.percentual_fipe.toFixed(2)}%` : '-'}</div>
          </div>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Status dos veículos</h2>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.thLeft}>Status</th>
                  <th className={styles.thCenter}>Quantidade</th>
                </tr>
              </thead>
              <tbody>
                {statusTotals.map((s) => (
                  <tr key={s.status}>
                    <td>{s.status}</td>
                    <td className={styles.alignCenter}>{s.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className={styles.actions}>
          <button className={styles.primaryBtn} onClick={handleSubmitFees} disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar Valores'}
          </button>
          {error && <div className={styles.error}>{error}</div>}
          {message && <div className={styles.success}>{message}</div>}
        </div>
      </div>
    </>
  );
};

export default Page;

'use client';
import { useRouter, useParams } from 'next/navigation';
import React, { useState, useEffect, useCallback } from 'react';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';
import CurrencyInput from '@/modules/common/components/CurrencyInput';
import styles from './page.module.css';
import DatePickerBR from '@/modules/common/components/DatePickerBR';
import modalStyles from '@/modules/admin/components/CollectionRequestsModal.module.css';
import VehicleDetailsModal from '@/modules/vehicles/components/VehicleDetailsModal';
import Header from '@/modules/admin/components/Header';
import { getLogger } from '@/modules/logger';

type CollectionGroup = {
  id: string;
  address: string;
  vehicle_count: number;
  current_fee: number | null;
};

type ApprovalGroup = CollectionGroup & {
  statuses?: { status: string; count: number }[];
  collection_date?: string | null;
};

type ClientSummary = {
  taxa_operacao?: number;
  percentual_fipe?: number;
  parqueamento?: number;
  quilometragem?: number;
};
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
  approvedGroups?: Array<{
    addressId: string;
    address: string;
    vehicle_count: number;
    collection_fee: number | null;
    collection_date?: string | null;
  }>;
  approvalTotal?: number;
  approvedTotal?: number;
  clientSummary?: ClientSummary;
  statusTotals?: StatusTotal[];
  collectionHistory?: Array<{
    collection_address: string;
    collection_fee_per_vehicle: number | null;
    collection_date: string | null;
    status?: string;
    payment_received?: boolean;
    payment_received_at?: string | null;
  }>;
  error?: string;
};

type PaymentsResponse = {
  success?: boolean;
  payments?: Array<{ address: string; fee: number | null; paid_at?: string | null }>;
  error?: string;
};

const Page = () => {
  const router = useRouter();
  const params = useParams() as any;
  const id = String(params?.id || '');
  const { get, post } = useAuthenticatedFetch();
  const [collectionRequests, setCollectionRequests] = useState<CollectionGroup[]>([]);
  const [approvalGroups, setApprovalGroups] = useState<ApprovalGroup[]>([]);
  const [approvedGroups, setApprovedGroups] = useState<CollectionGroup[]>([]);
  const [approvalTotal, setApprovalTotal] = useState<number>(0);
  const [approvedTotal, setApprovedTotal] = useState<number>(0);
  const [clientSummary, setClientSummary] = useState<ClientSummary | null>(null);
  const [statusTotals, setStatusTotals] = useState<StatusTotal[]>([]);
  const [collectionHistory, setCollectionHistory] = useState<
    {
      collection_address: string;
      collection_fee_per_vehicle: number | null;
      collection_date: string | null;
      status?: string;
      payment_received?: boolean;
      payment_received_at?: string | null;
    }[]
  >([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [fees, setFees] = useState<Record<string, number | undefined>>({});
  const [dates, setDates] = useState<Record<string, string>>({});
  const [vehiclesModal, setVehiclesModal] = useState<{ addressId: string; address: string } | null>(
    null
  );
  const [vehiclesList, setVehiclesList] = useState<
    {
      id: string;
      plate: string;
      brand: string;
      model: string;
      year?: number;
      status?: string;
      color?: string;
      created_at?: string;
      fipe_value?: number;
      current_odometer?: number | null;
      estimated_arrival_date?: string | null;
    }[]
  >([]);
  const [selectedVehicle, setSelectedVehicle] = useState<any | null>(null);
  const [payments, setPayments] = useState<
    Array<{ address: string; fee: number | null; paid_at?: string | null }>
  >([]);

  const fetchCollectionRequests = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const response = await get<ApiResponse>(`/api/admin/client-collections-summary/${id}`);
      logger.debug('API Response:', response);
      // Forçar sempre sucesso para depuração e garantir exibição de informações
      if (response.ok) {
        const data = response.data || {};
        logger.debug('Data received:', data);

        // Processar grupos de coleta (garantir array vazio se não houver dados)
        const groups = (data.groups || []).map(g => ({
          id: g.addressId,
          address: g.address,
          vehicle_count: g.vehicle_count || 0,
          current_fee: g.collection_fee,
        }));
        setCollectionRequests(groups);

        const initialFees: Record<string, number | undefined> = {};
        groups.forEach(req => {
          initialFees[req.id] = req.current_fee ?? undefined;
        });
        setFees(initialFees);
        setDates({});
        const ag = (response.data.approvalGroups || []).map(g => ({
          id: g.addressId,
          address: g.address,
          vehicle_count: g.vehicle_count || 0,
          current_fee: g.collection_fee,
          statuses: g.statuses,
          collection_date: (g as any).collection_date ?? null,
        }));
        setApprovalGroups(ag);

        // Processar grupos aprovados
        const ap = (data.approvedGroups || []).map((g: any) => ({
          id: `${g.addressId}${g.collection_date ? '|' + g.collection_date : '|no-date'}`,
          addressIdReal: g.addressId,
          address: g.address,
          vehicle_count: g.vehicle_count || 0,
          current_fee: g.collection_fee,
          collection_date: g.collection_date ?? null,
        }));
        setApprovedGroups(ap);

        // Definir totais e resumos (manter dados reais ou usar arrays vazios)
        setApprovalTotal(data.approvalTotal || 0);
        setApprovedTotal(data.approvedTotal || 0);
        setClientSummary(data.clientSummary || null);
        logger.debug('Client Summary:', data.clientSummary);
        setStatusTotals(data.statusTotals || []);
        setCollectionHistory(data.collectionHistory || []);
      } else {
        setError(
          response.data?.error || (response as any).error || 'Erro ao buscar solicitações de coleta'
        );
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

  const fetchPayments = useCallback(async () => {
    if (!id) return;
    try {
      const resp = await get<PaymentsResponse>(`/api/admin/collection-payments/${id}`);
      if (resp.ok && resp.data?.success) setPayments(resp.data.payments || []);
    } catch {}
  }, [id, get]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const handleFeeChange = (collectionId: string, value: number | undefined) => {
    setFees(prev => ({ ...prev, [collectionId]: value }));
  };

  // Salvamento por linha foi removido; mantemos um único botão de salvar geral

  const openVehiclesModal = async (addressId: string, address: string) => {
    try {
      setVehiclesList([]);
      const { supabase } = await import('@/modules/common/services/supabaseClient');
      const { data, error } = await supabase
        .from('vehicles')
        .select(
          'id, plate, brand, model, year, color, status, created_at, fipe_value, current_odometer, estimated_arrival_date'
        )
        .eq('client_id', id)
        .eq('pickup_address_id', addressId)
        .order('created_at', { ascending: false });
      if (error) return;
      const list = data || [];
      if (list.length === 1) {
        const v = list[0];
        setSelectedVehicle({
          ...v,
          year: v.year || 0,
          created_at: v.created_at || new Date().toISOString(),
        } as any);
        setVehiclesModal(null);
      } else {
        setVehiclesList(list);
        setVehiclesModal({ addressId, address });
      }
    } catch {}
  };

  const handleSubmitFees = async () => {
    try {
      setLoading(true);
      setError(null);
      setMessage(null);
      const payload = {
        clientId: id,
        fees: collectionRequests
          .map(req => ({ addressId: req.id, fee: fees[req.id], date: dates[req.id] || undefined }))
          .filter(
            (x): x is { addressId: string; fee: number; date: string | undefined } =>
              typeof x.fee === 'number'
          ),
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

  const confirmPayments = async () => {
    try {
      setLoading(true);
      setError(null);
      setMessage(null);
      const resp = await post(`/api/admin/confirm-collection-payment/${id}`, {});
      if (!resp.ok) throw new Error((resp as any).error || 'Erro ao confirmar pagamento');
      await Promise.all([fetchCollectionRequests(), fetchPayments()]);
      setMessage('Pagamento confirmado com sucesso.');
    } catch (e: any) {
      setError(e?.message || 'Erro ao confirmar pagamento');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <div className={styles.container}>
        <div className={styles.header}>
          <button className={styles.backButton} onClick={() => router.back()} aria-label="Voltar">
            ← Voltar
          </button>
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
                <th className={styles.thCenter}>Data de Coleta</th>
              </tr>
            </thead>
            <tbody>
              {collectionRequests.map(req => (
                <tr key={req.id}>
                  <td>{req.address}</td>
                  <td className={styles.alignCenter}>
                    <button
                      className={styles.primaryBtn}
                      style={{
                        background: 'transparent',
                        color: '#072e4c',
                        textDecoration: 'underline',
                        padding: 0,
                      }}
                      onClick={() => openVehiclesModal(req.id, req.address)}
                    >
                      {req.vehicle_count}
                    </button>
                  </td>
                  <td className={styles.alignCenter}>
                    <CurrencyInput
                      value={fees[req.id]}
                      onChange={value => handleFeeChange(req.id, value)}
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
                  <td className={styles.alignCenter}>
                    <DatePickerBR
                      valueIso={dates[req.id] || ''}
                      onChangeIso={v => setDates(prev => ({ ...prev, [req.id]: v }))}
                      ariaLabel={`Data de coleta para ${req.address}`}
                      containerClass={styles.datePicker}
                      inputClass={styles.dateInput}
                      buttonClass={styles.dateBtn}
                      hiddenInputClass={styles.hiddenDateNative}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={4} className={styles.alignRight + ' ' + styles.bold}>
                  Total estimado geral:
                </td>
                <td className={styles.bold}>
                  <div className={styles.totalRow}>
                    <span>
                      {collectionRequests
                        .reduce(
                          (acc, r) =>
                            acc +
                            (typeof fees[r.id] === 'number'
                              ? fees[r.id]! * (r.vehicle_count || 0)
                              : 0),
                          0
                        )
                        .toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                    <button
                      className={styles.primaryBtn}
                      onClick={handleSubmitFees}
                      disabled={loading}
                    >
                      {loading ? 'Salvando...' : 'Salvar'}
                    </button>
                  </div>
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
                  <th className={styles.thCenter}>Data de coleta</th>
                  <th className={styles.thCenter}>Valor por endereço (R$)</th>
                  <th className={styles.thCenter}>Total por endereço (R$)</th>
                </tr>
              </thead>
              <tbody>
                {approvalGroups.map(g => (
                  <tr key={g.id}>
                    <td>{g.address}</td>
                    <td className={styles.alignCenter}>
                      <button
                        className={styles.primaryBtn}
                        style={{
                          background: 'transparent',
                          color: '#072e4c',
                          textDecoration: 'underline',
                          padding: 0,
                        }}
                        onClick={() => openVehiclesModal(g.id, g.address)}
                      >
                        {g.vehicle_count}
                      </button>
                    </td>
                    <td className={styles.alignCenter}>
                      {g.collection_date && String(g.collection_date).length >= 10
                        ? `${String(g.collection_date).slice(8, 10)}/${String(g.collection_date).slice(5, 7)}/${String(g.collection_date).slice(0, 4)}`
                        : '-'}
                    </td>
                    <td className={styles.alignCenter}>
                      {typeof g.current_fee === 'number'
                        ? g.current_fee.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })
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
                  <td colSpan={4} className={styles.alignRight + ' ' + styles.bold}>
                    Total geral da coleta:
                  </td>
                  <td className={styles.bold}>
                    {approvalTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Coletas aprovadas</h2>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.thLeft}>Ponto de coleta</th>
                  <th className={styles.thCenter}>Veículos</th>
                  <th className={styles.thCenter}>Data de coleta</th>
                  <th className={styles.thCenter}>Valor por endereço (R$)</th>
                  <th className={styles.thCenter}>Total por endereço (R$)</th>
                </tr>
              </thead>
              <tbody>
                {approvedGroups.map(g => (
                  <tr key={g.id}>
                    <td>{g.address}</td>
                    <td className={styles.alignCenter}>
                      <button
                        className={styles.primaryBtn}
                        style={{
                          background: 'transparent',
                          color: '#072e4c',
                          textDecoration: 'underline',
                          padding: 0,
                        }}
                        onClick={() =>
                          openVehiclesModal((g as any).addressIdReal || g.id, g.address)
                        }
                      >
                        {g.vehicle_count}
                      </button>
                    </td>
                    <td className={styles.alignCenter}>
                      {(g as any).collection_date && String((g as any).collection_date).length >= 10
                        ? `${String((g as any).collection_date).slice(8, 10)}/${String((g as any).collection_date).slice(5, 7)}/${String((g as any).collection_date).slice(0, 4)}`
                        : '-'}
                    </td>
                    <td className={styles.alignCenter}>
                      {typeof (g as any).current_fee === 'number'
                        ? (g as any).current_fee.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })
                        : '-'}
                    </td>
                    <td className={styles.alignCenter}>
                      {typeof (g as any).current_fee === 'number'
                        ? ((g as any).current_fee * (g.vehicle_count || 0)).toLocaleString(
                            'pt-BR',
                            {
                              style: 'currency',
                              currency: 'BRL',
                            }
                          )
                        : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={4} className={styles.alignRight + ' ' + styles.bold}>
                    Total aprovado:
                  </td>
                  <td className={styles.bold}>
                    {approvedTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Botão global removido: agora está ao lado do total na tabela */}

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Datas e valores de coleta</h2>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.thLeft}>Endereço</th>
                  <th className={styles.thCenter}>Data</th>
                  <th className={styles.thCenter}>Valor por veículo (R$)</th>
                  <th className={styles.thCenter}>Status</th>
                  <th className={styles.thCenter}>Pagamento</th>
                </tr>
              </thead>
              <tbody>
                {collectionHistory.length === 0 && (
                  <tr>
                    <td colSpan={5} className={styles.alignCenter}>
                      Nenhuma data/valor cadastrado.
                    </td>
                  </tr>
                )}
                {collectionHistory.map((row, idx) => (
                  <tr key={`${row.collection_address}|${row.collection_date}|${idx}`}>
                    <td>{row.collection_address}</td>
                    <td className={styles.alignCenter}>
                      {row.collection_date && String(row.collection_date).length >= 10
                        ? `${String(row.collection_date).slice(8, 10)}/${String(row.collection_date).slice(5, 7)}/${String(row.collection_date).slice(0, 4)}`
                        : '-'}
                    </td>
                    <td className={styles.alignCenter}>
                      {typeof row.collection_fee_per_vehicle === 'number'
                        ? row.collection_fee_per_vehicle.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })
                        : '-'}
                    </td>
                    <td className={styles.alignCenter}>{row.status || '-'}</td>
                    <td className={styles.alignCenter}>
                      <div
                        style={{
                          display: 'flex',
                          gap: 8,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <span>
                          {row.payment_received
                            ? row.payment_received_at &&
                              String(row.payment_received_at).length >= 10
                              ? `${String(row.payment_received_at).slice(8, 10)}/${String(row.payment_received_at).slice(5, 7)}/${String(row.payment_received_at).slice(0, 4)}`
                              : 'Sim'
                            : 'Não'}
                        </span>
                        <button
                          className={styles.primaryBtn}
                          style={{ padding: '4px 8px' }}
                          disabled={loading}
                          onClick={async () => {
                            try {
                              setLoading(true);
                              setError(null);
                              const resp = await fetch('/api/admin/mark-collection-paid', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  clientId: id,
                                  address: row.collection_address,
                                  date: row.collection_date,
                                  paid: !row.payment_received,
                                }),
                              });
                              if (!resp.ok) throw new Error('Falha ao atualizar pagamento');
                              await fetchCollectionRequests();
                            } catch (e: any) {
                              setError(e?.message || 'Erro ao atualizar pagamento');
                            } finally {
                              setLoading(false);
                            }
                          }}
                          aria-label={
                            row.payment_received
                              ? 'Desfazer pagamento'
                              : 'Marcar pagamento recebido'
                          }
                        >
                          {row.payment_received ? 'Desfazer' : 'Marcar pago'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Resumo do cliente</h2>
          <div className={styles.summaryRow}>
            <div className={styles.summaryItem}>
              <b>Taxa de operação:</b>{' '}
              {typeof clientSummary?.taxa_operacao === 'number'
                ? clientSummary.taxa_operacao.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })
                : '-'}
            </div>
            <div className={styles.summaryItem}>
              <b>Parqueamento:</b>{' '}
              {typeof clientSummary?.parqueamento === 'number'
                ? clientSummary.parqueamento.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })
                : '-'}
            </div>
            <div className={styles.summaryItem}>
              <b>Quilometragem:</b>{' '}
              {(clientSummary as any)?.quilometragem !== undefined &&
              (clientSummary as any)?.quilometragem !== null &&
              String((clientSummary as any)?.quilometragem) !== ''
                ? `${Number((clientSummary as any).quilometragem).toLocaleString('pt-BR')} km`
                : '-'}
            </div>
            <div className={styles.summaryItem}>
              <b>Percentual da FIPE:</b>{' '}
              {typeof clientSummary?.percentual_fipe === 'number'
                ? `${clientSummary.percentual_fipe.toFixed(2)}%`
                : '-'}
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Pagamentos realizados</h2>
          {payments.length === 0 ? (
            <p>Nenhum pagamento confirmado.</p>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.thLeft}>Ponto de coleta</th>
                    <th className={styles.thCenter}>Fee por veículo (R$)</th>
                    <th className={styles.thCenter}>Data</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p, idx) => (
                    <tr key={idx}>
                      <td>{p.address}</td>
                      <td className={styles.alignCenter}>
                        {typeof p.fee === 'number'
                          ? p.fee.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                          : '-'}
                      </td>
                      <td className={styles.alignCenter}>
                        {p.paid_at ? new Date(p.paid_at).toLocaleString('pt-BR') : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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
                {statusTotals.map(s => (
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
          {error && <div className={styles.error}>{error}</div>}
          {message && <div className={styles.success}>{message}</div>}
        </div>

        {vehiclesModal && (
          <div className={modalStyles.modalOverlay} role="dialog" aria-modal="true">
            <div className={modalStyles.modalContent}>
              <button className={modalStyles.closeButton} onClick={() => setVehiclesModal(null)}>
                &times;
              </button>
              <h2>Veículos em {vehiclesModal.address}</h2>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th className={styles.thLeft}>Placa</th>
                      <th className={styles.thLeft}>Modelo</th>
                      <th className={styles.thCenter}>Ano</th>
                      <th className={styles.thLeft}>Status</th>
                      <th className={styles.thCenter}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vehiclesList.map(v => (
                      <tr key={v.id}>
                        <td>{v.plate}</td>
                        <td>
                          {v.brand} {v.model}
                        </td>
                        <td className={styles.alignCenter}>{v.year || '-'}</td>
                        <td>{v.status || '-'}</td>
                        <td className={styles.alignCenter}>
                          <button
                            className={styles.primaryBtn}
                            onClick={() =>
                              setSelectedVehicle({
                                ...v,
                                year: v.year || 0,
                                created_at: v.created_at || new Date().toISOString(),
                              })
                            }
                          >
                            Ver detalhes
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        <VehicleDetailsModal
          isOpen={!!selectedVehicle}
          vehicle={selectedVehicle}
          onClose={() => setSelectedVehicle(null)}
        />
      </div>
    </>
  );
};

export default Page;

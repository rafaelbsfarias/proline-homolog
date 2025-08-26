'use client';

import React, { useCallback, useState } from 'react';
import { useParams } from 'next/navigation';
import styles from './page.module.css';
import Header from '@/modules/admin/components/Header';
import MessageModal from '@/modules/common/components/MessageModal/MessageModal';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';

import { useClientOverview } from '@/modules/admin/hooks/useClientOverview';
import CollectionPricingSection from '@/modules/admin/components/overview/CollectionPricingSection';
import PendingApprovalSection from '@/modules/admin/components/overview/PendingApprovalSection';
import ApprovedCollectionSection from '@/modules/admin/components/overview/ApprovedCollectionSection';
import CollectionHistory from '@/modules/admin/components/overview/CollectionHistory';

const Page = () => {
  const params = useParams<{ id: string }>();
  const clientId: string = params.id;
  const { post } = useAuthenticatedFetch();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    pricingRequests = [],
    pendingApprovals = [],
    approvedCollections = [],
    approvalTotal = 0,
    approvedTotal = 0,
    history = [],
    loading: loadingData,
    error: loadError,
    refetchData,
  } = useClientOverview(clientId);

  const onSavePricing = useCallback(
    async (rows: { collectionId: string; collectionFeePerVehicle: number; date?: string }[]) => {
      try {
        setLoading(true);
        setMessage(null);
        setError(null);
        const resp = await post(`/api/admin/set-address-collection-fees`, {
          clientId,
          fees: rows,
        });
        if (!resp.ok) throw new Error(resp.error || 'Erro ao salvar valores');
        setMessage('Valores de coleta atualizados com sucesso!');
        await refetchData();
      } catch (e: any) {
        setError(e.message || 'Erro ao salvar valores');
      } finally {
        setLoading(false);
      }
    },
    [clientId, post, refetchData]
  );

  const onMarkPaid = useCallback(
    async (row: { clientId: string; address: string; date: string | null }) => {
      try {
        setLoading(true);
        setMessage(null);
        setError(null);
        const resp = await post(`/api/admin/mark-collection-paid`, { ...row, paid: true });
        if (!resp.ok) throw new Error(resp.error || 'Erro ao confirmar pagamento');
        setMessage('Pagamento confirmado com sucesso!');
        await refetchData();
      } catch (e: any) {
        setError(e.message || 'Erro ao confirmar pagamento');
      } finally {
        setLoading(false);
      }
    },
    [post, refetchData]
  );

  const pageError = loadError || error;

  return (
    <>
      <Header />
      <div className={styles.container}>
        <h1 className={styles.title}>Visão geral do cliente</h1>
        <p className={styles.note}>
          Defina os valores de coleta por ponto e acompanhe o status geral.
        </p>

        {/* 1) Precificação */}
        <CollectionPricingSection
          clientId={clientId}
          requests={pricingRequests}
          onSave={onSavePricing}
          loading={loading}
        />

        {/* 2) Aguardando aprovação do cliente */}
        <PendingApprovalSection groups={pendingApprovals} total={approvalTotal} />

        {/* 3) Coletas aprovadas (aguardam confirmação de pagamento) */}
        <ApprovedCollectionSection
          clientId={clientId}
          groups={approvedCollections}
          total={approvedTotal}
          onMarkPaid={onMarkPaid}
          loading={loading}
        />

        {/* 4) Histórico */}
        <CollectionHistory history={history} />

        {message && (
          <MessageModal message={message} onClose={() => setMessage(null)} variant="success" />
        )}
        {pageError && !message && (
          <MessageModal message={pageError} onClose={() => setError(null)} variant="error" />
        )}
      </div>
    </>
  );
};

export default Page;

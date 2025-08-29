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
import DateChangeRequestedSection from '@/modules/admin/components/overview/DateChangeRequestedSection';
import AdminDateAdequacyFlow from '@/modules/admin/components/overview/AdminDateAdequacyFlow';

const Page = () => {
  const params = useParams<{ id: string }>();
  const clientId: string = params.id;
  const { post } = useAuthenticatedFetch();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dateCheckItems, setDateCheckItems] = useState<
    { addressId: string; address: string; dateIso?: string | null }[]
  >([]);
  const [dateCheckOpen, setDateCheckOpen] = useState(false);
  const [pendingSuccessAfterFlow, setPendingSuccessAfterFlow] = useState<string | null>(null);

  const {
    pricingRequests = [],
    pendingApprovals = [],
    rescheduleGroups = [],
    approvedCollections = [],
    approvalTotal = 0,
    approvedTotal = 0,
    history = [],
    error: loadError,
    refetchData,
  } = useClientOverview(clientId);

  const onSavePricing = useCallback(
    async (
      rows: { collectionId: string; collectionFeePerVehicle: number; collectionDate?: string }[]
    ) => {
      try {
        setLoading(true);
        setMessage(null);
        setError(null);
        const resp = await post(`/api/admin/set-address-collection-fees`, {
          clientId,
          fees: rows.map(r => ({
            addressId: r.collectionId,
            fee: r.collectionFeePerVehicle,
            date: r.collectionDate,
          })),
        });
        if (!resp.ok) throw new Error(resp.error || 'Erro ao salvar valores');
        // If we have date checks to ask, open the flow; defer success message until done
        if (dateCheckItems.length) {
          setPendingSuccessAfterFlow('Valores de coleta atualizados com sucesso!');
          setDateCheckOpen(true);
        } else {
          setMessage('Valores de coleta atualizados com sucesso!');
        }
        await refetchData();
      } catch (e: any) {
        setError(e.message || 'Erro ao salvar valores');
      } finally {
        setLoading(false);
      }
    },
    [clientId, post, refetchData, dateCheckItems]
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
          onRefresh={refetchData}
          onAfterSaveAskDates={items => setDateCheckItems(items)}
        />

        {/* 2) Aguardando aprovação do cliente */}
        <PendingApprovalSection groups={pendingApprovals} total={approvalTotal} />

        {/* 3) Mudança de data solicitada (cliente) */}
        <DateChangeRequestedSection
          clientId={clientId}
          groups={rescheduleGroups}
          onRefresh={refetchData}
        />

        {/* 4) Coletas aprovadas */}
        <ApprovedCollectionSection groups={approvedCollections} total={approvedTotal} />

        {/* 5) Histórico */}
        <CollectionHistory history={history} />

        {message && (
          <MessageModal message={message} onClose={() => setMessage(null)} variant="success" />
        )}
        {pageError && !message && (
          <MessageModal message={pageError} onClose={() => setError(null)} variant="error" />
        )}

        {dateCheckOpen && (
          <AdminDateAdequacyFlow
            clientId={clientId}
            items={dateCheckItems}
            open={dateCheckOpen}
            onClose={() => {
              setDateCheckOpen(false);
              setDateCheckItems([]);
            }}
            onDone={async () => {
              if (pendingSuccessAfterFlow) setMessage(pendingSuccessAfterFlow);
              setPendingSuccessAfterFlow(null);
              await refetchData();
            }}
          />
        )}
      </div>
    </>
  );
};

export default Page;

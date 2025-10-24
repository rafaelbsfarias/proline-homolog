'use client';

import React, { useCallback, useState } from 'react';
import { useParams } from 'next/navigation';
import styles from './page.module.css';
import Link from 'next/link';
import Header from '@/modules/admin/components/Header';
import MessageModal from '@/modules/common/components/MessageModal/MessageModal';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';

import { useClientOverview } from '@/modules/admin/hooks/useClientOverview';
import CollectionPricingSection from '@/modules/admin/components/overview/CollectionPricingSection';
import ApprovedCollectionSection from '@/modules/admin/components/overview/ApprovedCollectionSection';
import CollectionHistory from '@/modules/admin/components/overview/CollectionHistory';
// PendingApprovalSection and DateChangeRequestedSection were replaced by unified section
import AdminDateAdequacyFlow from '@/modules/admin/components/overview/AdminDateAdequacyFlow';
import DatePendingUnifiedSection from '@/modules/admin/components/overview/DatePendingUnifiedSection';
import ClientVehiclesCard from '@/modules/admin/components/overview/ClientVehiclesCard';
import VehiclesAwaitingPickupSection from '@/modules/admin/components/overview/VehiclesAwaitingPickupSection';
import ProposePickupDateModal from '@/modules/admin/components/overview/ProposePickupDateModal';
import type { VehiclePickupRequest } from '@/modules/admin/components/overview/VehiclesAwaitingPickupSection';

const Page = () => {
  const params = useParams<{ id: string }>();
  const clientId: string = params.id;
  const { post, get } = useAuthenticatedFetch();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dateCheckItems, setDateCheckItems] = useState<
    { addressId: string; address: string; dateIso?: string | null }[]
  >([]);
  const [dateCheckOpen, setDateCheckOpen] = useState(false);
  const [pendingSuccessAfterFlow, setPendingSuccessAfterFlow] = useState<string | null>(null);

  // Estado para modal de retirada
  const [pickupModalVehicle, setPickupModalVehicle] = useState<{
    requestId?: string;
    vehicleId: string;
    plate: string;
    info: string;
    currentDate: string | null;
  } | null>(null);
  const [pickupProposedDate, setPickupProposedDate] = useState<string>('');
  const [pickupLoading, setPickupLoading] = useState(false);
  const [pickupError, setPickupError] = useState<string | null>(null);
  const [pickupSuccess, setPickupSuccess] = useState<string | null>(null);

  // Estado para veículos aguardando retirada/entrega (dados reais da API)
  const [pickupVehicles, setPickupVehicles] = useState<VehiclePickupRequest[]>([]);
  const [deliveryVehicles, setDeliveryVehicles] = useState<VehiclePickupRequest[]>([]);
  const [loadingPickupVehicles, setLoadingPickupVehicles] = useState(false);

  // Buscar veículos aguardando retirada/entrega ao carregar a página
  React.useEffect(() => {
    const fetchPickupVehicles = async () => {
      setLoadingPickupVehicles(true);
      try {
        const resp = await get<{
          success: boolean;
          pickups: VehiclePickupRequest[];
          deliveries: VehiclePickupRequest[];
        }>(`/api/admin/vehicles-awaiting-pickup?clientId=${clientId}`);
        if (resp.ok && resp.data?.success) {
          setPickupVehicles(resp.data.pickups || []);
          setDeliveryVehicles(resp.data.deliveries || []);
        }
      } catch {
        // Falha silenciosa - não interromper o carregamento da página
      } finally {
        setLoadingPickupVehicles(false);
      }
    };

    if (clientId) {
      fetchPickupVehicles();
    }
  }, [clientId, get]);

  const {
    pricingRequests = [],
    datePendingGroups = [],
    datePendingTotal = 0,
    approvedCollections = [],
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
      } catch (e: unknown) {
        const error = e as Error;
        setError(error.message || 'Erro ao salvar valores');
      } finally {
        setLoading(false);
      }
    },
    [clientId, post, refetchData, dateCheckItems]
  );

  // Handlers para retirada de veículos
  const handleAcceptPickupDate = async (requestId: string, vehicleId: string) => {
    setPickupLoading(true);
    setPickupError(null);
    try {
      // Verificar se é retirada ou entrega
      const allVehicles = [...pickupVehicles, ...deliveryVehicles];
      const vehicle = allVehicles.find(v => v.vehicleId === vehicleId && v.requestId === requestId);
      const isDelivery = vehicle?.type === 'delivery';

      // Chamar API apropriada
      const endpoint = isDelivery
        ? '/api/admin/accept-vehicle-delivery-date'
        : '/api/admin/accept-vehicle-pickup-date';

      const resp = await post(endpoint, { clientId, vehicleId, requestId });
      if (!resp.ok) throw new Error(resp.error || 'Erro ao aceitar data');

      setPickupSuccess(
        isDelivery ? 'Data de entrega aceita com sucesso!' : 'Data de retirada aceita com sucesso!'
      );

      // Recarregar a lista de veículos
      const reloadResp = await get<{
        success: boolean;
        pickups: VehiclePickupRequest[];
        deliveries: VehiclePickupRequest[];
      }>(`/api/admin/vehicles-awaiting-pickup?clientId=${clientId}`);
      if (reloadResp.ok && reloadResp.data?.success) {
        setPickupVehicles(reloadResp.data.pickups || []);
        setDeliveryVehicles(reloadResp.data.deliveries || []);
      }
    } catch (e: unknown) {
      const error = e as Error;
      setPickupError(error.message || 'Erro ao aceitar data');
    } finally {
      setPickupLoading(false);
    }
  };

  const handleProposePickupDate = (
    requestId: string,
    vehicleId: string,
    currentDate: string | null
  ) => {
    const allVehicles = [...pickupVehicles, ...deliveryVehicles];
    const vehicle = allVehicles.find(v => v.vehicleId === vehicleId && v.requestId === requestId);
    if (vehicle) {
      setPickupModalVehicle({
        requestId,
        vehicleId,
        plate: vehicle.plate,
        info: `${vehicle.brand} ${vehicle.model}${vehicle.year ? ` (${vehicle.year})` : ''}`,
        currentDate,
      });
      setPickupProposedDate(currentDate || '');
      setPickupError(null);
      setPickupSuccess(null);
    }
  };

  const handleConfirmPickupProposal = async () => {
    if (!pickupModalVehicle) return;
    setPickupLoading(true);
    setPickupError(null);
    setPickupSuccess(null);
    try {
      const resp = await post('/api/admin/propose-vehicle-pickup-date', {
        clientId,
        vehicleId: pickupModalVehicle.vehicleId,
        proposedDate: pickupProposedDate,
        requestId: pickupModalVehicle.requestId,
      });
      if (!resp.ok) throw new Error(resp.error || 'Erro ao propor data');
      setPickupSuccess('Proposta de data enviada com sucesso!');
      // Recarregar a lista de veículos
      const reloadResp = await get<{
        success: boolean;
        pickups: VehiclePickupRequest[];
        deliveries: VehiclePickupRequest[];
      }>(`/api/admin/vehicles-awaiting-pickup?clientId=${clientId}`);
      if (reloadResp.ok && reloadResp.data?.success) {
        setPickupVehicles(reloadResp.data.pickups || []);
        setDeliveryVehicles(reloadResp.data.deliveries || []);
      }
      setTimeout(() => {
        setPickupModalVehicle(null);
      }, 1000);
    } catch (e: unknown) {
      const error = e as Error;
      setPickupError(error.message || 'Erro ao propor data');
    } finally {
      setPickupLoading(false);
    }
  };

  const handleUpdateDeliveryFee = async (requestId: string, addressId: string, fee: number) => {
    try {
      const resp = await post('/api/admin/update-delivery-fee', { requestId, addressId, fee });
      if (!resp.ok) throw new Error(resp.error || 'Erro ao atualizar valor');

      // Recarregar a lista de veículos
      const reloadResp = await get<{
        success: boolean;
        pickups: VehiclePickupRequest[];
        deliveries: VehiclePickupRequest[];
      }>(`/api/admin/vehicles-awaiting-pickup?clientId=${clientId}`);

      if (reloadResp.ok && reloadResp.data?.success) {
        setPickupVehicles(reloadResp.data.pickups || []);
        setDeliveryVehicles(reloadResp.data.deliveries || []);
      }

      setPickupSuccess('Valor da entrega atualizado com sucesso!');
    } catch (e: unknown) {
      const error = e as Error;
      setPickupError(error.message || 'Erro ao atualizar valor');
      throw error; // Re-throw para o componente tratar
    }
  };

  const pageError = loadError || error;

  return (
    <>
      <Header />
      <div className={styles.container}>
        <div className={styles.headerRow}>
          <h1 className={styles.title}>Visão geral do cliente</h1>
          <Link className={styles.linkButton} href={`/dashboard/client/${clientId}/overview`}>
            Resumo Financeiro
          </Link>
        </div>

        {/* 1) Precificação */}
        <CollectionPricingSection
          clientId={clientId}
          requests={pricingRequests}
          onSave={onSavePricing}
          loading={loading}
          onRefresh={refetchData}
          onAfterSaveAskDates={items => setDateCheckItems(items)}
        />

        {/* 2) Aprovação de nova data (unificado) */}
        <DatePendingUnifiedSection
          clientId={clientId}
          groups={datePendingGroups || []}
          total={datePendingTotal || 0}
          onRefresh={refetchData}
        />

        {/* 4) Coletas aprovadas */}
        <ApprovedCollectionSection groups={approvedCollections} total={approvedTotal} />

        {/* 5) Veículos aguardando retirada/entrega */}
        {loadingPickupVehicles ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <p>Carregando solicitações de retirada/entrega...</p>
          </div>
        ) : (
          <VehiclesAwaitingPickupSection
            pickups={pickupVehicles}
            deliveries={deliveryVehicles}
            onAcceptDate={handleAcceptPickupDate}
            onProposeNewDate={handleProposePickupDate}
            onUpdateDeliveryFee={handleUpdateDeliveryFee}
            loading={pickupLoading}
          />
        )}

        {/* 6) Histórico */}
        <CollectionHistory history={history} />

        {/* 7) Veículos do cliente */}
        <ClientVehiclesCard clientId={clientId} />

        {message && (
          <MessageModal message={message} onClose={() => setMessage(null)} variant="success" />
        )}
        {pageError && !message && (
          <MessageModal message={pageError} onClose={() => setError(null)} variant="error" />
        )}
        {pickupSuccess && (
          <MessageModal
            message={pickupSuccess}
            onClose={() => setPickupSuccess(null)}
            variant="success"
          />
        )}
        {pickupError && !pickupSuccess && (
          <MessageModal
            message={pickupError}
            onClose={() => setPickupError(null)}
            variant="error"
          />
        )}

        {pickupModalVehicle && (
          <ProposePickupDateModal
            vehiclePlate={pickupModalVehicle.plate}
            vehicleInfo={pickupModalVehicle.info}
            initialDateIso={pickupProposedDate}
            loading={pickupLoading}
            error={pickupError || undefined}
            successMessage={pickupSuccess || undefined}
            onClose={() => setPickupModalVehicle(null)}
            onChangeDate={setPickupProposedDate}
            onConfirm={handleConfirmPickupProposal}
          />
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

'use client';

import { useEffect, useState } from 'react';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';
import VehicleDetailsModal from '@/modules/vehicles/components/VehicleDetailsModal';
import './VehicleCounter.css';
import RowCollectionModal from '../RowCollectionModal';
import BulkCollectionModal from '../BulkCollectionModal';
import StatusChips from '../StatusChips';
import VehicleFilters from '../VehicleFilters';
import BulkCollectionControls from '../BulkCollectionControls/BulkCollectionControls';
import { useVehicleManager } from '@/modules/client/hooks/useVehicleManager';
import { useAddresses } from '@/modules/client/hooks/useAddresses';
import { useStatusCounters } from '@/modules/client/hooks/useStatusCounters';
import { canClientModify } from '@/modules/client/utils/status';
import { makeLocalIsoDate } from '@/modules/client/utils/date';
import type { Vehicle, Method } from '@/modules/client/types';
import VehicleItemRow from './VehicleItemRow';
import Spinner from '@/modules/common/components/Spinner/Spinner';
import { LuRefreshCw, LuMinus, LuPlus, LuTriangleAlert } from 'react-icons/lu';
import Pagination from '@/modules/common/components/Pagination';

interface VehicleCounterProps {
  onRefresh?: () => void;
  onLoadingChange?: (loading: boolean) => void;
}

export default function VehicleCounter({ onRefresh, onLoadingChange }: VehicleCounterProps) {
  const [filterPlate, setFilterPlate] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const {
    vehicles, // This is now the paginated and filtered list from the server
    loading,
    error,
    refetch,
    totalCount,
    currentPage,
    totalPages,
    onPageChange,
  } = useVehicleManager({
    paginated: true,
    filterPlate,
    filterStatus,
  });

  const [showDetails, setShowDetails] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [showModal, setShowModal] = useState(false);

  const { addresses } = useAddresses();
  const [bulkMethod, setBulkMethod] = useState<Method>('collect_point');
  const [bulkAddressId, setBulkAddressId] = useState('');
  const [bulkEta, setBulkEta] = useState('');
  const [savingAll, setSavingAll] = useState(false);
  const { post } = useAuthenticatedFetch();
  const [bulkModalOpen, setBulkModalOpen] = useState<null | Method>(null);
  const [rowModalVehicle, setRowModalVehicle] = useState<Vehicle | null>(null);

  const minDateIsoLocal = makeLocalIsoDate();

  // This hook now receives all vehicles, so it can calculate all possible statuses for the filter dropdown
  const { statusOptions, statusCounts, sorter } = useStatusCounters(vehicles);

  // Effect to reset to page 1 when filters change
  useEffect(() => {
    if (currentPage !== 1) {
      onPageChange(1);
    }
  }, [filterPlate, filterStatus]);

  // Effect to inform parent about loading state, but only for the initial load.
  useEffect(() => {
    if (onLoadingChange) {
      // Only propagate loading state to parent during initial load
      if (isInitialLoading) {
        onLoadingChange(loading);
      }
    }

    // Once initial load is finished, set isInitialLoading to false
    if (isInitialLoading && !loading) {
      setIsInitialLoading(false);
    }
  }, [loading, onLoadingChange, isInitialLoading]);

  if (error) {
    return (
      <div className="vehicle-counter error">
        <div className="counter-icon" aria-hidden>
          <LuTriangleAlert />
        </div>
        <div className="counter-content">
          <h3>Erro</h3>
          <p>{error}</p>
          <button onClick={refetch} className="retry-button" aria-label="Tentar novamente">
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="vehicle-counter">
      <div className="counter-header">
        <div className="counter-content">
          <h3>Meus Veículos</h3>
          <div className="counter-number" aria-live="polite">
            {totalCount}
          </div>
          <p>{totalCount === 1 ? 'Veículo cadastrado' : 'Veículos cadastrados'}</p>
          <StatusChips counts={statusCounts} sorter={sorter} onSelect={setFilterStatus} />
        </div>
        <VehicleFilters
          filterPlate={filterPlate}
          setFilterPlate={setFilterPlate}
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
          statusOptions={statusOptions}
        />
        <div className="counter-actions">
          <button
            onClick={refetch}
            className="refresh-button"
            title="Atualizar contagem"
            aria-label="Atualizar contagem de veículos"
          >
            <LuRefreshCw />
          </button>
          {totalCount > 0 && (
            <button
              onClick={() => setShowDetails(v => !v)}
              className="details-button"
              title={showDetails ? 'Ocultar detalhes' : 'Mostrar detalhes'}
              aria-expanded={showDetails}
              aria-controls="vehicles-details"
            >
              {showDetails ? <LuMinus /> : <LuPlus />}
            </button>
          )}
        </div>
      </div>

      {showDetails && (
        <div className="vehicles-details" id="vehicles-details">
          {totalCount > 0 && (
            <BulkCollectionControls
              method={bulkMethod}
              setMethod={setBulkMethod}
              addressId={bulkAddressId}
              setAddressId={setBulkAddressId}
              saving={savingAll}
              onOpenModal={m => setBulkModalOpen(m)}
              addresses={addresses as any}
            />
          )}

          <h4 className="header">Detalhes dos Veículos:</h4>

          <div className="vehicles-list">
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
                <Spinner />
              </div>
            ) : (
              vehicles.map(vehicle => (
                <VehicleItemRow
                  key={vehicle.id}
                  vehicle={vehicle as Vehicle}
                  addresses={addresses as any}
                  collectionFee={vehicle.collection_fee ?? undefined}
                  onOpenDetails={v => {
                    setSelectedVehicle(v as Vehicle);
                    setShowModal(true);
                  }}
                  onOpenRowModal={v => setRowModalVehicle(v as Vehicle)}
                />
              ))
            )}
          </div>

          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={onPageChange}
            />
          )}
        </div>
      )}

      {showModal && (
        <VehicleDetailsModal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setSelectedVehicle(null);
          }}
          vehicle={
            selectedVehicle
              ? {
                  id: selectedVehicle.id,
                  plate: selectedVehicle.plate,
                  brand: selectedVehicle.brand,
                  model: selectedVehicle.model,
                  year: selectedVehicle.year,
                  color: selectedVehicle.color,
                  status: selectedVehicle.status ?? '',
                  created_at: selectedVehicle.created_at,
                  fipe_value: selectedVehicle.fipe_value,
                  client_name: undefined,
                  analyst: undefined,
                  arrival_forecast: undefined,
                  current_km: undefined,
                  params: undefined,
                  notes: undefined,
                  estimated_arrival_date: selectedVehicle.estimated_arrival_date,
                  current_odometer: selectedVehicle.current_odometer,
                  fuel_level: selectedVehicle.fuel_level,
                }
              : null
          }
        />
      )}

      {bulkModalOpen && (
        <BulkCollectionModal
          isOpen={!!bulkModalOpen}
          onClose={() => setBulkModalOpen(null)}
          method={bulkModalOpen}
          vehicles={vehicles as Vehicle[]}
          addresses={addresses as any}
          minDate={minDateIsoLocal}
          initialAddressId={bulkMethod === 'collect_point' ? bulkAddressId : undefined}
          initialEtaIso={bulkMethod === 'bring_to_yard' ? bulkEta : undefined}
          onApply={async payload => {
            const resp = await post('/api/client/set-vehicles-collection', payload);
            if (!resp.ok) throw new Error(resp.error || 'Erro ao aplicar');
            refetch();
          }}
        />
      )}

      {rowModalVehicle && (
        <RowCollectionModal
          isOpen={!!rowModalVehicle}
          onClose={() => setRowModalVehicle(null)}
          vehicle={{ id: rowModalVehicle.id, pickup_address_id: rowModalVehicle.pickup_address_id }}
          addresses={addresses as any}
          minDate={minDateIsoLocal}
          onApply={async payload => {
            const resp = await post('/api/client/set-vehicles-collection', payload);
            if (!resp.ok) throw new Error(resp.error || 'Erro ao salvar');
            refetch();
          }}
        />
      )}
    </div>
  );
}

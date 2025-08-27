'use client';

import { useEffect, useState } from 'react';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';
import VehicleDetailsModal from '@/modules/vehicles/components/VehicleDetailsModal';
import './VehicleCounter.css';
import RowCollectionModal from './RowCollectionModal';
import BulkCollectionModal from './BulkCollectionModal';
import StatusChips from './StatusChips';
import VehicleFilters from './VehicleFilters';
import BulkCollectionControls from './BulkCollectionControls';
import { useVehicles } from '@/modules/client/hooks/useVehicles';
import { useAddresses } from '@/modules/client/hooks/useAddresses';
import { useStatusCounters } from '@/modules/client/hooks/useStatusCounters';
import { sanitizeStatus, statusLabel, canClientModify } from '@/modules/client/utils/status';
import { formatDateBR, makeLocalIsoDate } from '@/modules/client/utils/date';
import type { Vehicle, Method } from '@/modules/client/types';
import VehicleItemRow from './VehicleItemRow';
import { VehicleStatus } from '@/modules/vehicles/constants/vehicleStatus';

// Types moved to modules/client/types.ts

// API response normalization moved to hooks

interface VehicleCounterProps {
  onRefresh?: () => void;
  onLoadingChange?: (loading: boolean) => void;
}

// Status helpers moved to utils

export default function VehicleCounter({ onRefresh, onLoadingChange }: VehicleCounterProps) {
  const { count, vehicles, loading, error, refetch } = useVehicles(onRefresh);

  console.log('VehicleCounter render', { vehicles });
  const [showDetails, setShowDetails] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [showModal, setShowModal] = useState(false);
  // only need post for actions
  const [filterPlate, setFilterPlate] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Collection controls state
  const { addresses } = useAddresses();
  const [bulkMethod, setBulkMethod] = useState<Method>('collect_point');
  const [bulkAddressId, setBulkAddressId] = useState('');
  // bulkEta (ISO YYYY-MM-DD) — não exigido na abertura do modal
  const [bulkEta, setBulkEta] = useState('');
  const [savingAll, setSavingAll] = useState(false);
  const [rowMethod, setRowMethod] = useState<Record<string, Method>>({});
  const [rowAddress, setRowAddress] = useState<Record<string, string>>({});
  const [rowEta, setRowEta] = useState<Record<string, string>>({});
  const [savingRow, setSavingRow] = useState<Record<string, boolean>>({});
  const { post } = useAuthenticatedFetch();
  const [bulkModalOpen, setBulkModalOpen] = useState<null | Method>(null);
  const [rowModalVehicle, setRowModalVehicle] = useState<Vehicle | null>(null);

  // Data helpers
  const minDateIsoLocal = makeLocalIsoDate();

  const formatDate = formatDateBR;

  const { statusOptions, statusCounts, sorter } = useStatusCounters(vehicles);

  const filteredVehicles = (vehicles || []).filter(v => {
    const plateOk = filterPlate
      ? v.plate.toUpperCase().includes(filterPlate.trim().toUpperCase())
      : true;
    const statusOk = filterStatus
      ? (v.status ?? '').toLowerCase() === filterStatus.toLowerCase()
      : true;
    return plateOk && statusOk;
  });

  const allVehiclesAllowed = vehicles.every(v => canClientModify(v.status));

  // if (loading) {
  //   return (
  //     <div className="vehicle-counter loading" role="status" aria-live="polite">
  //       <div className="counter-content">
  //         <h3>Carregando...</h3>
  //         <p>Contando seus veículos</p>
  //       </div>
  //     </div>
  //   );
  // }

  useEffect(() => {
    onLoadingChange?.(loading);
  }, [loading, onLoadingChange]);

  if (error) {
    return (
      <div className="vehicle-counter error">
        <div className="counter-icon" aria-hidden>
          ⚠️
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
            {count}
          </div>
          <p>{count === 1 ? 'veículo cadastrado' : 'veículos cadastrados'}</p>
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
            🔄
          </button>
          {count > 0 && (
            <button
              onClick={() => setShowDetails(v => !v)}
              className="details-button"
              title={showDetails ? 'Ocultar detalhes' : 'Mostrar detalhes'}
              aria-expanded={showDetails}
              aria-controls="vehicles-details"
            >
              {showDetails ? '🔼' : '🔽'}
            </button>
          )}
        </div>
      </div>

      {showDetails && (
        <div className="vehicles-details" id="vehicles-details">
          {vehicles.length > 0 && (
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

          <h4>Detalhes dos Veículos:</h4>

          {count > 0 && vehicles.length === 0 && (
            <p className="vehicles-hint">
              Encontramos registros, mas a lista não foi retornada pela API. Clique em atualizar.
            </p>
          )}

          <div className="vehicles-list">
            {filteredVehicles.map(vehicle => (
              <VehicleItemRow
                key={vehicle.id}
                vehicle={vehicle}
                addresses={addresses as any}
                onOpenDetails={v => {
                  setSelectedVehicle(v);
                  setShowModal(true);
                }}
                onOpenRowModal={v => setRowModalVehicle(v)}
              />
            ))}
          </div>
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
          vehicles={vehicles}
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

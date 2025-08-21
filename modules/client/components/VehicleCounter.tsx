'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';
import { supabase } from '@/modules/common/services/supabaseClient';
import styles from './VehicleCounter.module.css';
import VehicleDetailsModal from './VehicleDetailsModal';
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
import type { VehicleItem, Method } from '@/modules/client/types';
import VehicleItemRow from './VehicleItemRow';

interface VehicleCounterProps {
  onRefresh?: () => void;
}

export const VehicleCounter: React.FC<VehicleCounterProps> = ({ onRefresh }) => {
  const { count, vehicles, loading, error, refetch } = useVehicles(onRefresh);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleItem | null>(null);
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
  const [rowModalVehicle, setRowModalVehicle] = useState<VehicleItem | null>(null);

  // Data helpers
  const minDateIsoLocal = makeLocalIsoDate();

  const formatDate = formatDateBR;

  const { statusOptions, statusCounts, sorter } = useStatusCounters(vehicles);

  const filteredVehicles = useMemo(() => {
    return (vehicles || []).filter(v => {
      const plateOk = filterPlate ? v.plate.toUpperCase().includes(filterPlate.trim().toUpperCase()) : true;
      const statusOk = filterStatus ? ((v.status || '').toLowerCase() === filterStatus.toLowerCase()) : true;
      return plateOk && statusOk;
    });
  }, [vehicles, filterPlate, filterStatus]);

  const allVehiclesAllowed = vehicles.every(v => canClientModify(v.status));

  if (loading) {
    return (
      <div className={styles.vehicleCounter} role="status" aria-live="polite">
        <div className={styles.counterContent}>
          <h3>Carregando...</h3>
          <p>Contando seus veículos</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.vehicleCounter}>
        <div className={styles.counterIcon} aria-hidden>⚠️</div>
        <div className={styles.counterContent}>
          <h3>Erro</h3>
          <p>{error}</p>
          <button onClick={refetch} className={styles.retryButton} aria-label="Tentar novamente">
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.vehicleCounter}>
      <div className={styles.counterHeader}>
        <div className={styles.counterContent}>
          <h3>Meus Veículos</h3>
          <div className={styles.counterNumber} aria-live="polite">{count}</div>
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
        <div className={styles.counterActions}>
          <button
            onClick={refetch}
            className={styles.refreshButton}
            title="Atualizar contagem"
            aria-label="Atualizar contagem de veículos"
          >
            🔄
          </button>
          {count > 0 && (
            <button
              onClick={() => setShowDetails(prev => !prev)}
              className={styles.detailsButton}
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
        <div className={styles.vehiclesDetails} id="vehicles-details">
          {vehicles.length > 0 && (
            <BulkCollectionControls
              method={bulkMethod}
              setMethod={setBulkMethod}
              addressId={bulkAddressId}
              setAddressId={setBulkAddressId}
              saving={savingAll}
              onOpenModal={(m) => setBulkModalOpen(m)}
              addresses={addresses as any}
            />
          )}

          <h4 className={styles.sectionTitle}>Detalhes dos Veículos:</h4>

          {count > 0 && vehicles.length === 0 && (
            <p className={styles.vehiclesHint}>
              Encontramos registros, mas a lista não foi retornada pela API. Clique em atualizar.
            </p>
          )}

          <div className={styles.vehiclesList}>
            {filteredVehicles.map((vehicle) => (
              <VehicleItemRow
                key={vehicle.id}
                vehicle={vehicle}
                addresses={addresses as any}
                onOpenDetails={(v) => { setSelectedVehicle(v); setShowModal(true); }}
                onOpenRowModal={(v) => setRowModalVehicle(v)}
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
          vehicle={selectedVehicle}
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
          onApply={async (payload) => {
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
          onApply={async (payload) => {
            const resp = await post('/api/client/set-vehicles-collection', payload);
            if (!resp.ok) throw new Error(resp.error || 'Erro ao salvar');
            refetch();
          }}
        />
      )}
    </div>
  );
};

export default VehicleCounter;
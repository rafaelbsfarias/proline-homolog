'use client';

import { useEffect, useState, useMemo, forwardRef, useImperativeHandle } from 'react';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';
import VehicleDetailsModal from '@/modules/vehicles/components/VehicleDetailsModal';
import './VehicleCounter.css';
import RowCollectionModal from '../Modals/RowCollectionModal/RowCollectionModal';
import StatusChips from '../StatusChips/StatusChips';
import BulkCollectionControls from '../BulkCollectionControls/BulkCollectionControls';
import { useVehicleManager } from '@/modules/client/hooks/useVehicleManager';

import { makeLocalIsoDate } from '@/modules/client/utils/date';
import type { Vehicle } from '@/modules/client/types';
import VehicleItemRow from './VehicleItemRow';
import Spinner from '@/modules/common/components/Spinner/Spinner';
import { LuRefreshCw, LuMinus, LuPlus, LuTriangleAlert } from 'react-icons/lu';
import Pagination from '@/modules/common/components/Pagination/Pagination';
import VehicleCheckboxFiltersModal from '@/modules/common/components/VehicleCheckboxFiltersModal/VehicleCheckboxFiltersModal';
import VehicleToolbar from '../VehicleToolbar/VehicleToolbar';

import { AddressItem } from '@/modules/client/types';

interface VehicleCounterProps {
  onRefresh?: () => void;
  onLoadingChange?: (loading: boolean) => void;
  addresses: AddressItem[];
  collectPoints: AddressItem[];
}

export interface VehicleCounterRef {
  refetch: () => void;
}

const VehicleCounter = forwardRef<VehicleCounterRef, VehicleCounterProps>(
  ({ onRefresh, onLoadingChange, addresses, collectPoints }, ref) => {
    const [filterPlate, setFilterPlate] = useState('');
    const [filterStatus, setFilterStatus] = useState<string[]>([]);
    const [dateFilter, setDateFilter] = useState<string[]>([]);
    const [showDetails, setShowDetails] = useState(false);
    const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [rowModalVehicle, setRowModalVehicle] = useState<Vehicle | null>(null);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

    const { post } = useAuthenticatedFetch();

    const pageSize = 10;

    const {
      vehicles,
      loading,
      error,
      refetch,
      totalCount,
      currentPage,
      onPageChange,
      statusCounts,
    } = useVehicleManager({
      paginated: true,
      filterPlate,
      filterStatus,
      dateFilter,
    });

    useImperativeHandle(
      ref,
      () => ({
        refetch,
      }),
      [refetch]
    );

    const sorter = (a: [string, number], b: [string, number]) => a[0].localeCompare(b[0]);
    const statusOptions = Object.keys(statusCounts);

    const minDateIsoLocal = makeLocalIsoDate();

    const totalPagesAdjusted = useMemo(() => {
      return Math.ceil(totalCount / pageSize);
    }, [totalCount]);

    useEffect(() => {
      if (currentPage !== 1) {
        onPageChange(1);
      }
    }, [filterPlate, filterStatus, dateFilter]);

    useEffect(() => {
      if (currentPage > totalPagesAdjusted && totalPagesAdjusted > 0) {
        onPageChange(1);
      }
    }, [totalPagesAdjusted]);

    useEffect(() => {
      if (onLoadingChange && isInitialLoading) {
        onLoadingChange(loading);
      }
      if (isInitialLoading && !loading) {
        setIsInitialLoading(false);
      }
    }, [loading, onLoadingChange, isInitialLoading]);

    const handleClearFilters = () => {
      setFilterStatus([]);
      setDateFilter([]);
    };

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
            <StatusChips
              counts={statusCounts}
              sorter={sorter}
              onSelect={status => setFilterStatus(status ? [status] : [])}
            />
          </div>
          <div className="counter-actions-wrapper">
            <VehicleToolbar
              filterPlate={filterPlate}
              setFilterPlate={setFilterPlate}
              activeFilterCount={filterStatus.length + dateFilter.length}
              onFilterButtonClick={() => setIsFilterModalOpen(true)}
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
        </div>

        {showDetails && (
          <div className="vehicles-details" id="vehicles-details">
            {totalCount > 0 && (
              <BulkCollectionControls
                onSuccess={refetch}
                addresses={addresses}
                collectPoints={collectPoints}
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
                    vehicle={vehicle}
                    addresses={addresses}
                    collectionFee={vehicle.collection_fee ?? undefined}
                    onOpenDetails={v => {
                      setSelectedVehicle(v);
                      setShowModal(true);
                    }}
                    onOpenRowModal={v => setRowModalVehicle(v)}
                  />
                ))
              )}
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPagesAdjusted}
              onPageChange={onPageChange}
              currentItemsCount={vehicles.length}
            />
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
                    notes: undefined,
                    estimated_arrival_date: selectedVehicle.estimated_arrival_date,
                    current_odometer: selectedVehicle.current_odometer,
                    fuel_level: selectedVehicle.fuel_level,
                  }
                : null
            }
          />
        )}

        {rowModalVehicle && (
          <RowCollectionModal
            isOpen={!!rowModalVehicle}
            onClose={() => setRowModalVehicle(null)}
            vehicle={{
              id: rowModalVehicle.id,
              pickup_address_id: rowModalVehicle.pickup_address_id,
            }}
            addresses={addresses}
            minDate={minDateIsoLocal}
            mode={
              (rowModalVehicle.status || '').toUpperCase() === 'FINALIZADO'
                ? 'delivery'
                : 'collection'
            }
            onApply={async payload => {
              const resp = await post('/api/client/set-vehicles-collection', payload);
              if (!resp.ok) throw new Error(resp.error || 'Erro ao salvar');
              refetch();
            }}
          />
        )}

        <VehicleCheckboxFiltersModal
          isOpen={isFilterModalOpen}
          onClose={() => setIsFilterModalOpen(false)}
          filterStatus={filterStatus}
          onFilterStatusChange={setFilterStatus}
          availableStatuses={statusOptions}
          dateFilter={dateFilter}
          onDateFilterChange={setDateFilter}
          onClearCheckboxFilters={handleClearFilters}
          onApplyFilters={refetch}
        />
      </div>
    );
  }
);

VehicleCounter.displayName = 'VehicleCounter';

export default VehicleCounter;

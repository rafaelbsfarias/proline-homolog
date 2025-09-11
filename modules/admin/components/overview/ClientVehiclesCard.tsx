import React, { useMemo, useState } from 'react';
import VehicleSection from '@/modules/specialist/components/VehicleSection';
import { useAdminClientVehicles } from '@/modules/admin/hooks/useAdminClientVehicles';
import { useAdminClientVehicleStatuses } from '@/modules/admin/hooks/useAdminClientVehicleStatuses';
import { useAdminClientName } from '@/modules/admin/hooks/useAdminClientName';
import { useAdminClientVehicleStatusCounts } from '@/modules/admin/hooks/useAdminClientVehicleStatusCounts';

interface Props {
  clientId: string;
  clientName?: string;
}

const ClientVehiclesCard: React.FC<Props> = ({ clientId, clientName = 'Cliente' }) => {
  const [filterPlate, setFilterPlate] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const filters = useMemo(
    () => ({ plate: filterPlate, status: filterStatus }),
    [filterPlate, filterStatus]
  );

  const { name: fetchedName } = useAdminClientName(clientId);
  const { counts } = useAdminClientVehicleStatusCounts(clientId);

  const { vehicles, loading, error, refetch, currentPage, setCurrentPage, totalPages } =
    useAdminClientVehicles(clientId, filters);
  const { statuses: availableStatuses } = useAdminClientVehicleStatuses(clientId);

  return (
    <section
      style={{
        background: '#fff',
        borderRadius: 10,
        boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
        padding: '24px 20px',
        marginTop: 24,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <h2 style={{ fontSize: '1.35rem', fontWeight: 600, marginBottom: 12, color: '#333' }}>
          Veículos — {fetchedName || clientName}
        </h2>
      </div>

      {Object.keys(counts).length > 0 && (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
          {Object.entries(counts).map(([status, count]) => (
            <div
              key={status}
              style={{
                background: '#fafafa',
                border: '1px solid #eee',
                borderRadius: 8,
                padding: '8px 10px',
                fontSize: 12,
                color: '#333',
              }}
              aria-label={`Veículos com status ${status}: ${count}`}
            >
              <strong>{status}</strong>: {count}
            </div>
          ))}
        </div>
      )}

      <VehicleSection
        clientName={clientName}
        loading={loading}
        error={error}
        onRefetch={refetch}
        filterPlate={filterPlate}
        onFilterPlateChange={setFilterPlate}
        filterStatus={filterStatus}
        onFilterStatusChange={setFilterStatus}
        availableStatuses={availableStatuses}
        onClearFilters={() => {
          setFilterPlate('');
          setFilterStatus('');
        }}
        filteredVehicles={vehicles}
        onOpenChecklist={() => {}}
        onConfirmArrival={() => {}}
        confirming={{}}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        renderActions={() => null}
      />
    </section>
  );
};

export default ClientVehiclesCard;

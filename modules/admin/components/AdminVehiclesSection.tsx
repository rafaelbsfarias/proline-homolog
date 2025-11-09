'use client';

import React, { useMemo, useState } from 'react';
import StatusChips from '@/modules/client/components/StatusChips/StatusChips';
import VehicleToolbar from '@/modules/client/components/VehicleToolbar/VehicleToolbar';
import Pagination from '@/modules/common/components/Pagination/Pagination';
import Spinner from '@/modules/common/components/Spinner/Spinner';
import { LuRefreshCw } from 'react-icons/lu';
import { useAdminVehicles } from '@/modules/admin/hooks/useAdminVehicles';
import AdminVehicleFiltersModal from './AdminVehicleFiltersModal';
import '@/modules/client/components/VehicleCounter/VehicleCounter.css';

const sorter = (a: [string, number], b: [string, number]) => a[0].localeCompare(b[0]);

const AdminVehiclesSection: React.FC = () => {
  const [filterPlate, setFilterPlate] = useState('');
  const [filterStatuses, setFilterStatuses] = useState<string[]>([]);
  const [prepOnly, setPrepOnly] = useState(false);
  const [comOnly, setComOnly] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const { rows, total, statusCounts, page, setPage, totalPages, loading, error, refetch } =
    useAdminVehicles({
      plate: filterPlate,
      statuses: filterStatuses,
      preparacao: prepOnly,
      comercializacao: comOnly,
      pageSize: 10,
    });

  const availableStatuses = useMemo(() => Object.keys(statusCounts), [statusCounts]);

  return (
    <div className="vehicle-counter">
      <div className="counter-header">
        <div className="counter-content">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h3>Veículos</h3>
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="collapse-button"
              title={isCollapsed ? 'Expandir' : 'Colapsar'}
              aria-label={isCollapsed ? 'Expandir painel' : 'Colapsar painel'}
            >
              {isCollapsed ? '▼' : '▲'}
            </button>
          </div>
          <div className="counter-number" aria-live="polite">
            {total}
          </div>
          <p>{total === 1 ? 'Veículo encontrado' : 'Veículos encontrados'}</p>
          <StatusChips
            counts={statusCounts}
            sorter={sorter}
            onSelect={status => {
              if (!status) {
                setFilterStatuses([]);
                return;
              }
              // Toggle: se já está selecionado, remove; senão, substitui
              setFilterStatuses(prev => (prev.includes(status) ? [] : [status]));
            }}
          />
        </div>
        <div className="counter-actions-wrapper">
          <VehicleToolbar
            filterPlate={filterPlate}
            setFilterPlate={setFilterPlate}
            activeFilterCount={filterStatuses.length + (prepOnly ? 1 : 0) + (comOnly ? 1 : 0)}
            onFilterButtonClick={() => setIsFilterModalOpen(true)}
          />
          <div className="counter-actions">
            <button
              onClick={refetch}
              className="refresh-button"
              title="Atualizar lista"
              aria-label="Atualizar lista de veículos"
            >
              <LuRefreshCw />
            </button>
          </div>
        </div>
      </div>

      {!isCollapsed && (
        <div className="vehicles-details" id="admin-vehicles-details">
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
              <Spinner />
            </div>
          ) : error ? (
            <div className="vehicle-counter error" role="alert" style={{ margin: 0 }}>
              <div className="counter-content">
                <h3>Erro</h3>
                <p>{error}</p>
              </div>
            </div>
          ) : rows.length === 0 ? (
            <p style={{ padding: 12, color: '#666' }}>Nenhum veículo encontrado.</p>
          ) : (
            <div className="vehicles-list">
              {/* Desktop: Tabela */}
              <div className="vehicles-table-desktop">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', padding: '8px' }}>Placa</th>
                      <th style={{ textAlign: 'left', padding: '8px' }}>Cliente</th>
                      <th style={{ textAlign: 'left', padding: '8px' }}>Modelo</th>
                      <th style={{ textAlign: 'left', padding: '8px' }}>Status</th>
                      <th style={{ textAlign: 'left', padding: '8px' }}>Criado em</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map(row => (
                      <tr key={row.id}>
                        <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
                          {row.plate}
                        </td>
                        <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
                          {row.client_company || '-'}
                        </td>
                        <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
                          {[row.brand, row.model].filter(Boolean).join(' ')}
                        </td>
                        <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
                          {row.status || '-'}
                        </td>
                        <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
                          {new Date(row.created_at).toLocaleDateString('pt-BR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile: Cards */}
              <div className="vehicles-cards-mobile">
                {rows.map(row => (
                  <div key={row.id} className="vehicle-card-item">
                    <div className="card-field">
                      <strong>Placa:</strong>
                      <span>{row.plate}</span>
                    </div>
                    <div className="card-field">
                      <strong>Cliente:</strong>
                      <span>{row.client_company || '-'}</span>
                    </div>
                    <div className="card-field">
                      <strong>Modelo:</strong>
                      <span>{[row.brand, row.model].filter(Boolean).join(' ') || '-'}</span>
                    </div>
                    <div className="card-field">
                      <strong>Status:</strong>
                      <span>{row.status || '-'}</span>
                    </div>
                    <div className="card-field card-field-last">
                      <strong>Criado em:</strong>
                      <span>{new Date(row.created_at).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                  <Pagination
                    currentPage={page}
                    totalPages={totalPages}
                    onPageChange={setPage}
                    currentItemsCount={rows.length}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <AdminVehicleFiltersModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        availableStatuses={availableStatuses}
        selectedStatuses={filterStatuses}
        onChangeStatuses={setFilterStatuses}
        preparacao={prepOnly}
        comercializacao={comOnly}
        onChangePreparacao={setPrepOnly}
        onChangeComercializacao={setComOnly}
        onClear={() => {
          setFilterStatuses([]);
          setPrepOnly(false);
          setComOnly(false);
        }}
        onApply={() => {
          // nothing extra; hook reacts to state
        }}
      />
    </div>
  );
};

export default AdminVehiclesSection;

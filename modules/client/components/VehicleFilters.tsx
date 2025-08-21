import React from 'react';

interface Props {
  filterPlate: string;
  setFilterPlate: (v: string) => void;
  filterStatus: string;
  setFilterStatus: (v: string) => void;
  statusOptions: string[];
}

export default function VehicleFilters({ filterPlate, setFilterPlate, filterStatus, setFilterStatus, statusOptions }: Props) {
  return (
    <div className="counter-filters" role="group" aria-label="Filtros de veículo">
      <input
        type="text"
        placeholder="Buscar por placa"
        value={filterPlate}
        onChange={e => setFilterPlate(e.target.value)}
        aria-label="Buscar por placa"
      />
      <select
        value={filterStatus}
        onChange={e => setFilterStatus(e.target.value)}
        aria-label="Filtrar por status"
      >
        <option value="">Todos os status</option>
        {statusOptions.map(s => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>
    </div>
  );
}


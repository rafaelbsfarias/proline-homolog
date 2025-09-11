import Input from '@/modules/common/components/Input/Input';
import Select from '@/modules/common/components/Select/Select';
import React from 'react';

interface Props {
  filterPlate: string;
  setFilterPlate: (v: string) => void;
  filterStatus: string;
  setFilterStatus: (v: string) => void;
  statusOptions: string[];
}

export default function VehicleFilters({
  filterPlate,
  setFilterPlate,
  filterStatus,
  setFilterStatus,
  statusOptions,
}: Props) {
  return (
    <div className="counter-filters" role="group" aria-label="Filtros de veículo">
      <Input
        id="placa"
        name="placa"
        type="text"
        placeholder="Buscar por placa"
        value={filterPlate}
        onChange={e => setFilterPlate(e.target.value)}
        aria-label="Buscar por placa"
      />
      <Select
        id="status"
        name="status"
        value={filterStatus}
        onChange={e => setFilterStatus(e.target.value)}
        options={[
          { value: '', label: 'Todos os status' }, // opção padrão
          ...statusOptions.map(s => ({ value: s, label: s })),
        ]}
      />
    </div>
  );
}

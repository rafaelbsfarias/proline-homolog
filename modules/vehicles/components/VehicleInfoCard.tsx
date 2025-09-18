'use client';

import React from 'react';
import { translateFuelLevel, VEHICLE_CONSTANTS } from '@/app/constants/messages';
import { formatDateBR } from '@/modules/client/utils/date';

export interface VehicleInfo {
  plate: string;
  brand: string;
  model: string;
  year: number;
  color?: string;
  status: string;
  created_at?: string;
  fipe_value?: number;
  current_odometer?: number | null;
  fuel_level?: string | null;
  estimated_arrival_date?: string | null;
}

function formatCurrencyBRL(value?: number) {
  if (!value && value !== 0) return 'N/A';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function getStatusLabel(status: string) {
  return (
    VEHICLE_CONSTANTS.VEHICLE_STATUS[status as keyof typeof VEHICLE_CONSTANTS.VEHICLE_STATUS] ||
    status
  );
}

const VehicleInfoCard: React.FC<{ vehicle: VehicleInfo }> = ({ vehicle }) => {
  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 10,
        boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
        padding: '24px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 20,
        }}
      >
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, margin: 0, color: '#333' }}>
          Informações Básicas
        </h2>
      </div>

      <div style={{ display: 'grid', gap: '16px' }}>
        <Row
          label="Placa"
          value={<span style={{ fontFamily: 'monospace' }}>{vehicle.plate}</span>}
        />
        <Row label="Marca" value={vehicle.brand} />
        <Row label="Modelo" value={`${vehicle.model} (${vehicle.year})`} />
        <Row label="Cor" value={vehicle.color || 'N/A'} />
        <Row
          label="Status"
          value={
            <span
              style={{
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '0.875rem',
                background: '#e8f5e8',
                color: '#2e7d32',
              }}
            >
              {getStatusLabel(vehicle.status)}
            </span>
          }
        />
        <Row label="Valor FIPE" value={formatCurrencyBRL(vehicle.fipe_value)} />
        <Row label="KM Atual" value={vehicle.current_odometer ?? 'N/A'} />
        <Row label="Nível de Combustível" value={translateFuelLevel(vehicle.fuel_level || '')} />
        <Row
          label="Cadastrado em"
          value={vehicle.created_at ? formatDateBR(vehicle.created_at) : 'N/A'}
        />
        <Row
          label="Previsão de Chegada"
          value={
            vehicle.estimated_arrival_date ? formatDateBR(vehicle.estimated_arrival_date) : 'N/A'
          }
        />
      </div>
    </div>
  );
};

const Row: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'space-between',
      padding: '8px 0',
      borderBottom: '1px solid #eee',
    }}
  >
    <span style={{ fontWeight: 500 }}>{label}:</span>
    <span>{value}</span>
  </div>
);

export default VehicleInfoCard;

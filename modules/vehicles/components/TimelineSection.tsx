'use client';

import React, { useMemo } from 'react';
import { formatDateBR } from '@/modules/client/utils/date';

export interface TimelineProps {
  createdAt: string;
  estimatedArrivalDate?: string | null;
  inspectionDate?: string | null;
  inspectionFinalized?: boolean;
  vehicleHistory?: VehicleHistoryEntry[];
}

export interface VehicleHistoryEntry {
  id: string;
  vehicle_id: string;
  status: string;
  prevision_date: string | null;
  end_date: string | null;
  created_at: string;
}

function formatDate(date?: string | null) {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('pt-BR');
}

const TimelineSection: React.FC<TimelineProps> = ({
  createdAt,
  estimatedArrivalDate,
  inspectionDate,
  inspectionFinalized,
  vehicleHistory = [],
}) => {
  // Debug log
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      // eslint-disable-next-line no-console
      console.log('📊 [TimelineSection] Received vehicleHistory:', {
        count: vehicleHistory.length,
        items: vehicleHistory.map(h => ({ id: h.id, status: h.status, created_at: h.created_at })),
      });
    }
  }, [vehicleHistory]);

  const sortedHistory = useMemo(() => {
    const items = [...vehicleHistory];
    items.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    return items;
  }, [vehicleHistory]);

  const colorFor = (label: string) => {
    if (label.includes('Orçament')) return '#f39c12';
    if (label.includes('Finalizada')) return '#27ae60';
    if (label.includes('Iniciad')) return '#3498db';
    return '#9b59b6';
  };

  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 10,
        boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
        padding: '24px',
      }}
    >
      <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: 20, color: '#333' }}>
        Timeline do Veículo
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Event dotColor="#3498db" title="Veículo Cadastrado" date={formatDateBR(createdAt)} />
        {estimatedArrivalDate && (
          <Event
            dotColor="#f39c12"
            title="Previsão de Chegada"
            date={formatDate(estimatedArrivalDate)}
          />
        )}
        {inspectionDate && (
          <Event dotColor="#e74c3c" title="Análise Iniciada" date={formatDate(inspectionDate)} />
        )}
        {inspectionDate && inspectionFinalized && (
          <Event dotColor="#27ae60" title="Análise Finalizada" date={formatDate(inspectionDate)} />
        )}

        {sortedHistory.map(h => (
          <Event
            key={`vh-${h.id}`}
            dotColor={colorFor(h.status)}
            title={h.status}
            date={formatDate(h.created_at)}
          />
        ))}
      </div>
    </div>
  );
};

const Event: React.FC<{ dotColor: string; title: string; date: string }> = ({
  dotColor,
  title,
  date,
}) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
    <div
      style={{
        width: '12px',
        height: '12px',
        borderRadius: '50%',
        background: dotColor,
      }}
    />
    <div>
      <div style={{ fontWeight: 500 }}>{title}</div>
      <div style={{ fontSize: '0.875rem', color: '#666' }}>{date}</div>
    </div>
  </div>
);

export default TimelineSection;

'use client';

import React, { useMemo } from 'react';
import { formatDateBR } from '@/modules/client/utils/date';
import { getStatusColor, TIMELINE_COLORS } from '@/modules/vehicles/constants/timelineColors';

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
  partner_service?: string;
  prevision_date: string | null;
  end_date: string | null;
  created_at: string;
}

function formatDate(date?: string | null) {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('pt-BR');
}

const statusDisplayMap: Record<string, string> = {
  orcamento_iniciado: 'Orçamento Iniciado',
  orcamento_finalizado: 'Orçamento Finalizado',
  orcamento_aprovado: 'Orçamento Aprovado',
  orcamento_reprovado: 'Orçamento Reprovado',
  servico_iniciado: 'Serviço Iniciado',
  servico_finalizado: 'Serviço Finalizado',
  'Fase Orçamentária Iniciada - Mecânica': 'Fase Orçamentária Iniciada - Mecânica',
  'FASE ORÇAMENTÁRIA': 'Fase Orçamentária',
};

const getEventTitle = (historyEntry: VehicleHistoryEntry): string => {
  const { status, partner_service } = historyEntry;
  let baseTitle = statusDisplayMap[status];

  if (!baseTitle) {
    baseTitle = status
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  if (partner_service) {
    return `${baseTitle} - ${partner_service}`;
  }

  return baseTitle;
};

const TimelineSection: React.FC<TimelineProps> = ({
  createdAt,
  estimatedArrivalDate,
  inspectionDate,
  inspectionFinalized,
  vehicleHistory = [],
}) => {
  const sortedHistory = useMemo(() => {
    const items = [...vehicleHistory];
    items.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    return items;
  }, [vehicleHistory]);

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
        <Event
          dotColor={TIMELINE_COLORS.BLUE}
          title="Veículo Cadastrado"
          date={formatDateBR(createdAt)}
        />
        {estimatedArrivalDate && (
          <Event
            dotColor={TIMELINE_COLORS.ORANGE}
            title="Previsão de Chegada"
            date={formatDate(estimatedArrivalDate)}
          />
        )}
        {inspectionDate && (
          <Event
            dotColor={TIMELINE_COLORS.RED}
            title="Análise Iniciada"
            date={formatDate(inspectionDate)}
          />
        )}
        {inspectionDate && inspectionFinalized && (
          <Event
            dotColor={TIMELINE_COLORS.GREEN}
            title="Análise Finalizada"
            date={formatDate(inspectionDate)}
          />
        )}

        {sortedHistory.map(h => {
          const title = getEventTitle(h);

          return (
            <Event
              key={`vh-${h.id}`}
              dotColor={getStatusColor(title)}
              title={title}
              date={formatDate(h.created_at)}
            />
          );
        })}
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

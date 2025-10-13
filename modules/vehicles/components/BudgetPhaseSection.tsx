'use client';

import React, { useMemo } from 'react';
import { TIMELINE_COLORS } from '@/modules/vehicles/constants/timelineColors';
import { formatDateBR } from '@/modules/client/utils/date';
import { useVehicleTimeline } from '@/modules/vehicles/hooks/useVehicleTimeline';

type Props = {
  vehicleId: string;
  createdAt: string;
  estimatedArrivalDate?: string | null;
  inspectionDate?: string | null;
  inspectionFinalized?: boolean;
};

function formatDate(date?: string | null) {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('pt-BR');
}

const BudgetPhaseSection: React.FC<Props> = ({
  vehicleId,
  createdAt,
  estimatedArrivalDate,
  inspectionDate,
  inspectionFinalized,
}) => {
  const { events } = useVehicleTimeline(vehicleId);
  const budgetStartedEvents = useMemo(
    () =>
      events
        .filter(e => e.type === 'BUDGET_STARTED')
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [events]
  );
  const budgetApproved = useMemo(
    () => events.find(e => e.type === 'BUDGET_APPROVED') || null,
    [events]
  );

  const approvedTitle = useMemo(() => {
    if (!budgetApproved) return null;
    const raw = budgetApproved.title?.trim() || '';
    // Se já vier com categoria no título, usar como está
    if (/^Orçamento Aprovado\s*-\s*/i.test(raw)) return raw;

    // Caso contrário, tentar inferir da única fase iniciada
    if (budgetStartedEvents.length === 1) {
      const started = budgetStartedEvents[0]?.title || '';
      const m = started.match(/Fase Orçamentária Iniciada\s*-\s*(.+)$/i);
      const category = m?.[1]?.trim();
      if (category) return `Orçamento Aprovado - ${category}`;
    }

    // Fallback
    return 'Orçamento Aprovado';
  }, [budgetApproved, budgetStartedEvents]);

  // Exibe a timeline completa (legada) nesta nova seção
  // Se o evento de orçamentação não existir ainda, mostra os demais itens mesmo assim

  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 10,
        boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
        padding: '24px',
      }}
    >
      <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: 16, color: '#333' }}>
        Timeline do Veículo
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* 1. Veículo Cadastrado - SEMPRE */}
        <Item
          color={TIMELINE_COLORS.BLUE}
          title="Veículo Cadastrado"
          date={formatDateBR(createdAt)}
        />

        {/* 2. Previsão de Chegada - CONDICIONAL */}
        {estimatedArrivalDate && (
          <Item
            color={TIMELINE_COLORS.ORANGE}
            title="Previsão de Chegada"
            date={formatDate(estimatedArrivalDate)}
          />
        )}

        {/* 3. Análise Iniciada - CONDICIONAL */}
        {inspectionDate && (
          <Item
            color={TIMELINE_COLORS.RED}
            title="Análise Iniciada"
            date={formatDate(inspectionDate)}
          />
        )}

        {/* 4. Análise Finalizada - CONDICIONAL */}
        {inspectionDate && inspectionFinalized && (
          <Item
            color={TIMELINE_COLORS.GREEN}
            title="Análise Finalizada"
            date={formatDate(inspectionDate)}
          />
        )}

        {/* 5. Fase Orçamentária Iniciada - pode haver múltiplas categorias */}
        {budgetStartedEvents.map(ev => (
          <Item
            key={ev.id}
            color={TIMELINE_COLORS.ORANGE}
            title={ev.title}
            date={formatDateBR(ev.date)}
          />
        ))}

        {/* 6. Orçamento Aprovado - CONDICIONAL */}
        {budgetApproved && (
          <Item
            color={TIMELINE_COLORS.GREEN}
            title={approvedTitle || 'Orçamento Aprovado'}
            date={formatDateBR(budgetApproved.date)}
          />
        )}
      </div>
    </div>
  );
};

const Item: React.FC<{ color: string; title: string; date: string }> = ({ color, title, date }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
    <div
      style={{
        width: '12px',
        height: '12px',
        borderRadius: '50%',
        background: color,
      }}
    />
    <div>
      <div style={{ fontWeight: 500 }}>{title}</div>
      <div style={{ fontSize: '0.875rem', color: '#666' }}>{date}</div>
    </div>
  </div>
);

export default BudgetPhaseSection;

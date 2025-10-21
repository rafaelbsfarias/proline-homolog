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

const BudgetPhaseSection: React.FC<Props> = ({ vehicleId, createdAt }) => {
  const { events } = useVehicleTimeline(vehicleId);

  // Ordenar todos os eventos por created_at (já vem ordenado do backend, mas garantimos)
  const sortedEvents = useMemo(
    () => events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [events]
  );

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
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          maxHeight: '60vh',
          overflowY: 'auto',
          paddingRight: 4,
        }}
      >
        {/* 1. Veículo Cadastrado - SEMPRE PRIMEIRO */}
        <Item
          color={TIMELINE_COLORS.BLUE}
          title="Veículo Cadastrado"
          date={formatDateBR(createdAt)}
        />

        {/* 2. Eventos do vehicle_history - ORDENADOS POR created_at */}
        {sortedEvents.map(ev => {
          let color: string = TIMELINE_COLORS.BLUE;
          let title = ev.title;
          const titleLower = title.toLowerCase();

          // Determinar cor baseado no tipo de evento e no título
          switch (ev.type) {
            case 'BUDGET_STARTED':
              color = TIMELINE_COLORS.ORANGE;
              break;
            case 'BUDGET_APPROVED':
              color = TIMELINE_COLORS.GREEN;
              // Inferir categoria se necessário
              const raw = ev.title?.trim() || '';
              if (!/^Orçamento Aprovado\s*-\s*/i.test(raw)) {
                const budgetStartedEvs = sortedEvents.filter(e => e.type === 'BUDGET_STARTED');
                if (budgetStartedEvs.length === 1) {
                  const started = budgetStartedEvs[0]?.title || '';
                  const m = started.match(/Fase Orçamentária Iniciada\s*-\s*(.+)$/i);
                  const category = m?.[1]?.trim();
                  if (category) title = `Orçamento Aprovado - ${category}`;
                }
              }
              break;
            case 'EXECUTION_STARTED':
              color = TIMELINE_COLORS.ORANGE;
              // Exibir texto específico do serviço quando disponível
              {
                const ps = (ev.meta?.partner_service || '').toString().trim();
                const psLower = ps.toLowerCase();
                if (ps && psLower !== 'serviço' && psLower !== 'servico') {
                  title = `Execução de ${ps} Iniciada`;
                } else {
                  // Fallback: manter título original
                  title = ev.title || 'Em Execução';
                }
              }
              break;
            case 'SERVICE_COMPLETED':
              color = TIMELINE_COLORS.BLUE;
              // Exibir finalização específica do serviço, quando disponível
              {
                const ps = (ev.meta?.partner_service || '').toString().trim();
                const psLower = ps.toLowerCase();
                if (ps && psLower !== 'serviço' && psLower !== 'servico') {
                  title = `Execução de ${ps} Finalizada`;
                } else {
                  // Fallback genérico
                  title = ev.title || 'Serviço Concluído';
                }
              }
              break;
            case 'EXECUTION_COMPLETED':
              color = TIMELINE_COLORS.GREEN;
              // Exibir a categoria específica que foi finalizada
              if (ev.meta?.partner_service) {
                title = `Execução Finalizada - ${ev.meta.partner_service}`;
              } else {
                title = 'Execução Finalizada';
              }
              break;
            default:
              // Para eventos que não têm tipo específico, determinar cor pelo título
              if (titleLower.includes('cadastrado')) {
                color = TIMELINE_COLORS.BLUE;
              } else if (titleLower.includes('previsão') || titleLower.includes('previsao')) {
                color = TIMELINE_COLORS.ORANGE;
              } else if (titleLower.includes('chegada confirmada')) {
                color = TIMELINE_COLORS.GREEN;
              } else if (titleLower.includes('análise') || titleLower.includes('analise')) {
                if (titleLower.includes('iniciada')) {
                  color = TIMELINE_COLORS.RED;
                } else if (titleLower.includes('finalizada')) {
                  color = TIMELINE_COLORS.GREEN;
                }
              } else if (titleLower.includes('aguardando') || titleLower.includes('coleta')) {
                color = TIMELINE_COLORS.ORANGE;
              } else if (
                titleLower.includes('fase orçament') ||
                titleLower.includes('fase orcament')
              ) {
                color = TIMELINE_COLORS.ORANGE;
              } else if (titleLower.includes('em análise')) {
                color = TIMELINE_COLORS.ORANGE;
              }
          }

          return <Item key={ev.id} color={color} title={title} date={formatDateBR(ev.date)} />;
        })}
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

'use client';

import React, { useEffect, useState } from 'react';
import DatePickerBR from '@/modules/common/components/DatePickerBR';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';
import { formatDateBR, makeLocalIsoDate } from '@/modules/client/utils/date';

type Group = {
  addressId: string;
  address: string;
  vehicle_count: number;
  collection_fee: number | null;
  collection_date: string | null; // ISO
};

const VehicleCollectionSection: React.FC = () => {
  const { get, post } = useAuthenticatedFetch();
  const [loading, setLoading] = useState(true);

  // resumo/valores
  const [approvalTotal, setApprovalTotal] = useState<number>(0);
  const [count, setCount] = useState<number>(0);

  // grupos por endereço para a mensagem
  const [groups, setGroups] = useState<Group[]>([]);

  // marcar dias no calendário
  const [highlightDates, setHighlightDates] = useState<string[]>([]);

  // UI: reagendamento e pagamento
  const [rescheduleOpenFor, setRescheduleOpenFor] = useState<string | null>(null);
  const [newDateIso, setNewDateIso] = useState<string>('');
  // Pagamento mock removido conforme documentação; card mantém apenas aprovação e reagendamento

  const minIso = makeLocalIsoDate();

  const loadSummary = async () => {
    setLoading(true);
    const resp = await get<{
      success: boolean;
      approvalTotal?: number;
      count?: number;
      dates?: string[];
      groups?: Group[];
      error?: string;
    }>('/api/client/collection-summary');
    if (resp.ok && resp.data?.success) {
      setApprovalTotal(Number(resp.data.approvalTotal || 0));
      setCount(Number(resp.data.count || 0));
      setHighlightDates(Array.isArray(resp.data.dates) ? resp.data.dates : []);
      setGroups(Array.isArray(resp.data.groups) ? resp.data.groups : []);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadSummary();
  }, []);

  return (
    <div className="vehicle-counter">
      <div className="counter-header">
        <div className="counter-content" style={{ width: '100%' }}>
          <h3>Coleta de Veículos</h3>

          {/* Mensagem guiada */}
          <div style={{ marginBottom: 8 }}>
            Prezado(a), sugerimos a coleta dos veículos
            {groups.length === 0 ? (
              <> no momento não há sugestões pendentes.</>
            ) : (
              <>
                {groups.map(g => (
                  <div
                    key={g.addressId}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 12,
                    }}
                  >
                    <span>
                      - localizados no endereço {g.address || g.addressId} no dia{' '}
                      {g.collection_date ? formatDateBR(g.collection_date) : 'a definir'}
                      {typeof g.collection_fee === 'number' && (
                        <>
                          {' '}
                          no valor de{' '}
                          {(g.collection_fee * g.vehicle_count).toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })}
                        </>
                      )}
                    </span>
                    <span>
                      <button
                        className="refresh-button"
                        onClick={() =>
                          setRescheduleOpenFor(
                            rescheduleOpenFor === g.addressId ? null : g.addressId
                          )
                        }
                        aria-expanded={rescheduleOpenFor === g.addressId}
                        title="Sugerir outra data para este endereço"
                      >
                        Sugerir outra data
                      </button>
                    </span>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Campo de data (canto direito) quando o cliente escolher "Sugerir outra data" */}
          {rescheduleOpenFor && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <DatePickerBR
                valueIso={newDateIso}
                minIso={minIso}
                onChangeIso={setNewDateIso}
                ariaLabel="Selecionar nova data"
              />
              <button
                className="refresh-button"
                onClick={async () => {
                  if (!newDateIso || !rescheduleOpenFor) return;
                  const resp2 = await post('/api/client/collection-reschedule', {
                    addressId: rescheduleOpenFor,
                    new_date: newDateIso,
                  });
                  if (resp2.ok) {
                    setRescheduleOpenFor(null);
                    setNewDateIso('');
                    await loadSummary(); // atualiza grupos/valores
                  }
                }}
              >
                Enviar sugestão
              </button>
            </div>
          )}

          {/* Total consolidado */}
          <div style={{ marginTop: 8, fontWeight: 600 }}>
            {loading
              ? 'Carregando valor...'
              : `Total a pagar (${count} veículo(s)): ${approvalTotal.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                })}`}
          </div>

          {/* Confirmar coleta → exibe meios de pagamento; status dos veículos passa para "COLETA APROVADA" */}
          <div style={{ marginTop: 8 }}>
            Para confirmar a coleta dos veículos clique
            <button
              className="refresh-button"
              style={{ marginLeft: 8 }}
              onClick={async () => {
                if (!groups.length) return;
                // aprova por endereço
                for (const g of groups) {
                  await post('/api/client/collection-approve', { addressId: g.addressId });
                }
                await loadSummary();
              }}
              disabled={!groups.length || loading}
            >
              aqui
            </button>
          </div>
        </div>

        <div className="counter-actions" />
      </div>

      {/* Calendário: marca todas as datas de coleta agendadas */}
      <div
        style={{
          marginTop: 12,
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 8,
          padding: 12,
        }}
      >
        <CalendarMonth highlightDates={highlightDates} />
      </div>
    </div>
  );
};

export default VehicleCollectionSection;

/** Calendário simples do mês atual com destaque nas datas recebidas (YYYY-MM-DD) */
function CalendarMonth({ highlightDates }: { highlightDates: string[] }) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0..11

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startWeekday = firstDay.getDay(); // 0=Dom
  const totalDays = lastDay.getDate();

  const days: (number | null)[] = [];
  for (let i = 0; i < startWeekday; i++) days.push(null);
  for (let d = 1; d <= totalDays; d++) days.push(d);

  const highlight = new Set(highlightDates || []);
  const fmt = (d: number) =>
    `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

  const cellStyle: React.CSSProperties = {
    border: '1px solid rgba(255,255,255,0.12)',
    minHeight: 56,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 600,
    borderRadius: 6,
  };

  return (
    <div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: 6,
          marginBottom: 8,
          opacity: 0.8,
        }}
      >
        {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((w, i) => (
          <div key={`${w}-${i}`} style={{ textAlign: 'center', fontWeight: 600 }}>
            {w}
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
        {days.map((d, idx) => {
          if (d === null) return <div key={`e-${idx}`} />;
          const dateStr = fmt(d);
          const isHighlight = highlight.has(dateStr);
          return (
            <div
              key={dateStr}
              style={{
                ...cellStyle,
                background: isHighlight ? 'rgba(76, 175, 80, 0.35)' : 'transparent',
              }}
              aria-label={dateStr}
              title={formatDateBR(dateStr)}
            >
              {d}
            </div>
          );
        })}
      </div>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import DatePickerBR from '@/modules/common/components/DatePickerBR';
import { formatDateBR, makeLocalIsoDate } from '@/modules/client/utils/date';
import { useClientCollectionSummary } from '@/modules/client/hooks/useClientCollectionSummary';

type Group = {
  addressId: string;
  address: string;
  vehicle_count: number;
  collection_fee: number | null;
  collection_date: string | null; // ISO
};

const VehicleCollectionSection: React.FC = () => {
  const { groups, approvalTotal, count, highlightDates, loading, approveAll, reschedule, reload } =
    useClientCollectionSummary();

  // UI: reagendamento e pagamento
  const [rescheduleOpenFor, setRescheduleOpenFor] = useState<string | null>(null);
  const [newDateIso, setNewDateIso] = useState<string>('');
  // Pagamento mock removido conforme documentação; card mantém apenas aprovação e reagendamento

  const minIso = makeLocalIsoDate();

  // dados do card movidos para o hook; HTML/CSS preservados

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
                      {(g as any)?.original_date &&
                        g.collection_date &&
                        (g as any).original_date !== g.collection_date && (
                          <em style={{ color: '#a00', marginLeft: 6, fontStyle: 'italic' }}>
                            (Nova data proposta pelo administrador; sua escolha inicial foi{' '}
                            {formatDateBR((g as any).original_date as string)})
                          </em>
                        )}
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
                disabledDatesIso={(() => {
                  const g = groups.find(x => x.addressId === rescheduleOpenFor);
                  const arr: string[] = [];
                  if (g?.collection_date) arr.push(g.collection_date);
                  // @ts-ignore original_date may be provided by API
                  if ((g as any)?.original_date) arr.push((g as any).original_date as string);
                  return arr.filter(Boolean) as string[];
                })()}
                onChangeIso={setNewDateIso}
                ariaLabel="Selecionar nova data"
              />
              <button
                className="refresh-button"
                onClick={async () => {
                  if (!newDateIso || !rescheduleOpenFor) return;
                  const ok = await reschedule(rescheduleOpenFor, newDateIso);
                  if (ok) {
                    setRescheduleOpenFor(null);
                    setNewDateIso('');
                    await reload(); // atualiza grupos/valores
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
                await approveAll();
                await reload();
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

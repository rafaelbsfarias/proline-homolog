'use client';

import React, { useState } from 'react';
import DatePickerBR from '@/modules/common/components/DatePickerBR';
import { formatDateBR, makeLocalIsoDate } from '@/modules/client/utils/date';
import { formatTotalCurrencyBR } from '@/modules/common/utils/format';
import { useClientCollectionSummary } from '@/modules/client/hooks/useClientCollectionSummary';
import MessageModal from '@/modules/common/components/MessageModal/MessageModal';
import CalendarMonth from './CalendarMonth';

type Group = {
  addressId: string;
  address: string;
  vehicle_count: number;
  collection_fee: number | null;
  collection_date: string | null; // ISO
  original_date?: string | null;
};

const VehicleCollectionSection: React.FC = () => {
  const { groups, approvalTotal, count, highlightDates, loading, approveAll, reschedule, reload } =
    useClientCollectionSummary();

  // UI: reagendamento
  const [rescheduleOpenFor, setRescheduleOpenFor] = useState<string | null>(null);
  const [newDateIso, setNewDateIso] = useState<string>('');
  const [busyApprove, setBusyApprove] = useState(false);
  const [busyReschedule, setBusyReschedule] = useState<Record<string, boolean>>({});
  // Card mantém apenas aprovação e reagendamento
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    msg: string;
  } | null>(null);

  const handleRescheduleSubmit = async () => {
    if (!newDateIso || !rescheduleOpenFor) return;
    setBusyReschedule(prev => ({ ...prev, [rescheduleOpenFor]: true }));
    const ok = await reschedule(rescheduleOpenFor, newDateIso);
    if (ok) {
      setRescheduleOpenFor(null);
      setNewDateIso('');
      setFeedback({ type: 'success', msg: 'Solicitação de nova data enviada.' });
      await reload();
    } else {
      setFeedback({ type: 'error', msg: 'Falha ao enviar a nova data.' });
    }
    setBusyReschedule(prev => ({ ...prev, [rescheduleOpenFor!]: false }));
  };

  const handleApproveAll = async () => {
    if (!groups.length) return;
    setBusyApprove(true);
    const ok = await approveAll();
    if (ok) {
      setFeedback({ type: 'success', msg: 'Coleta confirmada com sucesso.' });
      await reload();
    } else {
      setFeedback({ type: 'error', msg: 'Não foi possível confirmar a coleta.' });
    }
    setBusyApprove(false);
  };

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
                      {g.original_date &&
                        g.collection_date &&
                        g.original_date !== g.collection_date && (
                          <em style={{ color: '#a00', marginLeft: 6, fontStyle: 'italic' }}>
                            {g.proposed_by === 'client'
                              ? `Você propôs uma nova data; a data anterior era ${formatDateBR(g.original_date)}`
                              : `Nova data proposta pelo administrador; sua escolha inicial foi ${formatDateBR(g.original_date)}`}
                          </em>
                        )}
                      {typeof g.collection_fee === 'number' && (
                        <> no valor de {formatTotalCurrencyBR(g.collection_fee, g.vehicle_count)}</>
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
                onClick={handleRescheduleSubmit}
                aria-busy={!!busyReschedule[rescheduleOpenFor]}
                disabled={!!busyReschedule[rescheduleOpenFor]}
              >
                {busyReschedule[rescheduleOpenFor] ? 'Enviando…' : 'Enviar sugestão'}
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

          {/* Confirmar coleta: aprova a coleta e atualiza status dos veículos */}
          <div style={{ marginTop: 8 }}>
            Para confirmar a coleta dos veículos clique
            <button
              className="refresh-button"
              style={{ marginLeft: 8 }}
              onClick={handleApproveAll}
              aria-busy={busyApprove}
              disabled={!groups.length || loading || busyApprove}
            >
              {busyApprove ? 'Confirmando…' : 'aqui'}
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
      {feedback && (
        <MessageModal
          variant={feedback.type}
          message={feedback.msg}
          onClose={() => setFeedback(null)}
        />
      )}
    </div>
  );
};

export default VehicleCollectionSection;

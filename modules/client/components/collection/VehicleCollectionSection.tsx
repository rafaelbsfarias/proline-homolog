'use client';

import React, { useState } from 'react';
import DatePickerBR from '@/modules/common/components/DatePickerBR';
import { formatDateBR, makeLocalIsoDate } from '@/modules/client/utils/date';
import { formatTotalCurrencyBR } from '@/modules/common/utils/format';
import { useClientCollectionSummary } from '@/modules/client/hooks/useClientCollectionSummary';
import { useIndividualApproval } from '@/modules/client/hooks/collection/useIndividualApproval';
import MessageModal from '@/modules/common/components/MessageModal/MessageModal';
import CalendarMonth from './Calendar/CalendarMonth';

interface VehicleCollectionSectionProps {
  onLoadingChange?: (loading: boolean) => void;
}

const VehicleCollectionSection: React.FC<VehicleCollectionSectionProps> = ({ onLoadingChange }) => {
  const { groups, approvalTotal, count, highlightDates, loading, approveAll, reschedule, reload } =
    useClientCollectionSummary({ onLoadingChange });

  // Hook para aprovação individual
  const {
    acceptProposal,
    rejectProposal,
    accepting,
    rejecting,
    error: approvalError,
    canAcceptProposal,
    canRejectProposal,
  } = useIndividualApproval();

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

  // Handlers para aprovação individual
  const handleAcceptProposal = async (addressId: string, proposedBy?: 'client' | 'admin') => {
    const success = await acceptProposal(addressId, proposedBy);
    if (success) {
      setFeedback({ type: 'success', msg: 'Proposta aceita com sucesso.' });
      await reload();
    } else {
      setFeedback({
        type: 'error',
        msg: approvalError || 'Erro ao aceitar proposta.',
      });
    }
  };

  const handleRejectProposal = async (addressId: string, proposedBy?: 'client' | 'admin') => {
    const success = await rejectProposal(addressId, proposedBy);
    if (success) {
      setFeedback({ type: 'success', msg: 'Proposta rejeitada com sucesso.' });
      await reload();
    } else {
      setFeedback({
        type: 'error',
        msg: approvalError || 'Erro ao rejeitar proposta.',
      });
    }
  };

  const minIso = makeLocalIsoDate();

  // dados do card movidos para o hook; HTML/CSS preservados

  return (
    <div className="vehicle-counter">
      <div className="counter-header">
        <div className="counter-content" style={{ width: '100%' }}>
          <h3>Coleta de Veículos</h3>

          {/* Dynamic card layout (meus veículos) para pendências por endereço+data */}
          <div className="vehicles-details">
            <h4>Pendências por endereço</h4>
            {!groups.length ? (
              <div className="vehicles-list">
                <div className="vehicle-item">
                  <div className="vehicle-info">
                    <div className="vehicle-model">Nenhuma sugestão pendente.</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="vehicles-list">
                {groups.map(g => (
                  <div key={`${g.addressId}|${g.collection_date || ''}`} className="vehicle-item">
                    <div className="vehicle-info">
                      <div>
                        <div className="vehicle-model">{g.address}</div>
                        <div className="vehicle-meta">
                          <span className="vehicle-date">
                            Data:{' '}
                            {g.collection_date ? formatDateBR(g.collection_date) : 'A definir'}
                          </span>
                          {typeof g.collection_fee === 'number' && (
                            <span>
                              Total: {formatTotalCurrencyBR(g.collection_fee, g.vehicle_count)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div>
                        <span className="vehicle-plate">{g.vehicle_count} veículo(s)</span>
                      </div>
                    </div>

                    {/* Frase formal apenas quando a data foi proposta pelo administrador */}
                    {g.proposed_by === 'admin' && (
                      <div className="vehicle-extra-line">
                        Prezado(a), sugerimos a coleta dos veículos localizados no endereço{' '}
                        {g.address} no dia{' '}
                        {g.collection_date ? formatDateBR(g.collection_date) : 'a definir'}
                        {typeof g.collection_fee === 'number' && (
                          <>
                            {' '}
                            no valor de {formatTotalCurrencyBR(g.collection_fee, g.vehicle_count)}
                          </>
                        )}
                        .
                      </div>
                    )}

                    {/* Contexto de mudança vs original */}
                    {g.original_date &&
                      g.collection_date &&
                      g.original_date !== g.collection_date && (
                        <div className="vehicle-extra-line" style={{ color: '#cfe8ff' }}>
                          {g.proposed_by === 'client'
                            ? `Você propôs uma nova data; a data anterior era ${formatDateBR(g.original_date)}`
                            : `Nova data proposta pelo administrador; sua escolha inicial foi ${formatDateBR(
                                g.original_date
                              )}`}
                        </div>
                      )}

                    <div className="vehicle-row-actions" style={{ display: 'flex', gap: 8 }}>
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

                      {/* Botões de aceitar/rejeitar apenas para propostas do admin */}
                      {canAcceptProposal(g.proposed_by) && (
                        <button
                          className="refresh-button"
                          style={{ backgroundColor: '#28a745', color: 'white' }}
                          onClick={() => handleAcceptProposal(g.addressId, g.proposed_by)}
                          disabled={accepting}
                          title="Aceitar proposta de coleta"
                        >
                          {accepting ? 'Aceitando…' : 'Aceitar'}
                        </button>
                      )}

                      {canRejectProposal(g.proposed_by) && (
                        <button
                          className="refresh-button"
                          style={{ backgroundColor: '#dc3545', color: 'white' }}
                          onClick={() => handleRejectProposal(g.addressId, g.proposed_by)}
                          disabled={rejecting}
                          title="Rejeitar proposta de coleta"
                        >
                          {rejecting ? 'Rejeitando…' : 'Rejeitar'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
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
                  if (g?.original_date) arr.push(g.original_date);
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

          {/* Total consolidado - apenas itens aprováveis (propostas do admin) */}
          <div style={{ marginTop: 8, fontWeight: 600 }}>
            {loading
              ? 'Carregando valor...'
              : (() => {
                  const approvableGroups = groups.filter(g => g.proposed_by === 'admin');
                  const approvableTotal = approvableGroups.reduce((sum, g) => {
                    if (typeof g.collection_fee === 'number') {
                      return sum + g.collection_fee * g.vehicle_count;
                    }
                    return sum;
                  }, 0);
                  const approvableCount = approvableGroups.reduce(
                    (sum, g) => sum + g.vehicle_count,
                    0
                  );

                  return approvableGroups.length > 0
                    ? `Total a pagar (${approvableCount} veículo(s)): ${approvableTotal.toLocaleString(
                        'pt-BR',
                        {
                          style: 'currency',
                          currency: 'BRL',
                        }
                      )}`
                    : 'Nenhum item pendente de aprovação';
                })()}
          </div>

          {/* Confirmar coleta: aprova a coleta e atualiza status dos veículos */}
          {(() => {
            const approvableGroups = groups.filter(g => g.proposed_by === 'admin');
            return approvableGroups.length > 0 ? (
              <div style={{ marginTop: 8 }}>
                Para confirmar a coleta dos veículos clique
                <button
                  className="refresh-button"
                  style={{ marginLeft: 8 }}
                  onClick={handleApproveAll}
                  aria-busy={busyApprove}
                  disabled={!approvableGroups.length || loading || busyApprove}
                >
                  {busyApprove ? 'Confirmando…' : 'aqui'}
                </button>
              </div>
            ) : null;
          })()}
        </div>

        <div className="counter-actions" />
      </div>

      {/* Calendário: marca todas as datas de coleta agendadas */}
      {/* <div
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
      )}*/}
    </div>
  );
};

export default VehicleCollectionSection;

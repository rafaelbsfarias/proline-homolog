'use client';

import React, { useState } from 'react';
import DatePickerBR from '@/modules/common/components/DatePickerBR/DatePickerBR';
import { formatDateBR, makeLocalIsoDate } from '@/modules/client/utils/date';
import { formatTotalCurrencyBR } from '@/modules/common/utils/format';
import { useClientCollectionSummary } from '@/modules/client/hooks/useClientCollectionSummary';
import { useIndividualApproval } from '@/modules/client/hooks/collection/useIndividualApproval';
import MessageModal from '@/modules/common/components/MessageModal/MessageModal';
import CalendarMonth from '../Calendar/CalendarMonth';
import styles from './VehicleCollectionSection.module.css';
import { SolidButton } from '@/modules/common/components/SolidButton/SolidButton';
import { OutlineButton } from '@/modules/common/components/OutlineButton/OutlineButton';
import Modal from '@/modules/common/components/Modal/Modal';

interface VehicleCollectionSectionProps {
  onLoadingChange?: (loading: boolean) => void;
}

const VehicleCollectionSection: React.FC<VehicleCollectionSectionProps> = ({ onLoadingChange }) => {
  const { groups, approvalTotal, count, highlightDates, loading, approveAll, reschedule, reload } =
    useClientCollectionSummary({ onLoadingChange });

  const {
    acceptProposal,
    rejectProposal,
    accepting,
    rejecting,
    error: approvalError,
    canAcceptProposal,
    canRejectProposal,
  } = useIndividualApproval();

  const [rescheduleOpenFor, setRescheduleOpenFor] = useState<string | null>(null);
  const [newDateIso, setNewDateIso] = useState<string>('');
  const [busyApprove, setBusyApprove] = useState(false);
  const [busyReschedule, setBusyReschedule] = useState<Record<string, boolean>>({});
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
    } else {
      setFeedback({ type: 'error', msg: 'Não foi possível confirmar a coleta.' });
    }
    setBusyApprove(false);
  };

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

  return (
    <div className={styles.section}>
      <h3 className={styles.header}>Coleta de Veículos</h3>

      <div className={styles.details}>
        <h4 className={styles.subheading}>Pendências por endereço</h4>
        {!groups.length ? (
          <div className={styles.list}>
            <div className={styles.card}>
              <div className={styles.cardInfo}>
                <div className={styles.address}>Nenhuma sugestão pendente.</div>
              </div>
            </div>
          </div>
        ) : (
          <div className={styles.list}>
            {groups.map(g => (
              <div key={`${g.addressId}|${g.collection_date || ''}`} className={styles.card}>
                <div className={styles.cardInfo}>
                  <div>
                    <div className={styles.address}>{g.address}</div>
                    <div className={styles.meta}>
                      <span className="vehicle-date">
                        Data: {g.collection_date ? formatDateBR(g.collection_date) : 'A definir'}
                      </span>
                      {typeof g.collection_fee === 'number' && (
                        <span>
                          Total: {formatTotalCurrencyBR(g.collection_fee, g.vehicle_count)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className={styles.vehicleCount}>{g.vehicle_count} veículo(s)</span>
                  </div>
                </div>

                {g.proposed_by === 'admin' && (
                  <div className={styles.extraLine}>
                    A coleta dos veículos agendada para o endereço {g.address} no dia{' '}
                    {g.collection_date ? formatDateBR(g.collection_date) : 'a definir'}
                    {typeof g.collection_fee === 'number' && (
                      <> no valor de {formatTotalCurrencyBR(g.collection_fee, g.vehicle_count)}</>
                    )}
                    .
                  </div>
                )}

                {g.original_date && g.collection_date && g.original_date !== g.collection_date && (
                  <div className={styles.extraLine} style={{ color: '#2563eb' }}>
                    {g.proposed_by === 'client'
                      ? `Você propôs uma nova data; a data anterior era ${formatDateBR(
                          g.original_date
                        )}`
                      : `Nova data proposta pelo administrador; sua escolha inicial foi ${formatDateBR(
                          g.original_date
                        )}`}
                  </div>
                )}

                <div className={styles.actions}>
                  <OutlineButton
                    className={styles.actionButton}
                    onClick={() =>
                      setRescheduleOpenFor(rescheduleOpenFor === g.addressId ? null : g.addressId)
                    }
                    aria-expanded={rescheduleOpenFor === g.addressId}
                    title="Sugerir outra data para este endereço"
                  >
                    Sugerir outra data
                  </OutlineButton>

                  {canAcceptProposal(g.proposed_by) && (
                    <SolidButton
                      className={styles.acceptButton}
                      onClick={() => handleAcceptProposal(g.addressId, g.proposed_by)}
                      disabled={accepting}
                      title="Aceitar proposta de coleta"
                    >
                      {accepting ? 'Aceitando…' : 'Aceitar'}
                    </SolidButton>
                  )}

                  {canRejectProposal(g.proposed_by) && (
                    <SolidButton
                      className={styles.rejectButton}
                      onClick={() => handleRejectProposal(g.addressId, g.proposed_by)}
                      disabled={rejecting}
                      title="Rejeitar proposta de coleta"
                    >
                      {rejecting ? 'Rejeitando…' : 'Rejeitar'}
                    </SolidButton>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {rescheduleOpenFor && (
        <Modal
          isOpen={!!rescheduleOpenFor}
          onClose={() => setRescheduleOpenFor(null)}
          title="Sugerir Nova Data"
          size="sm"
          showCloseButton
        >
          <div className={styles.rescheduleSection}>
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
            <SolidButton
              onClick={handleRescheduleSubmit}
              aria-busy={!!busyReschedule[rescheduleOpenFor]}
              disabled={!!busyReschedule[rescheduleOpenFor]}
            >
              {busyReschedule[rescheduleOpenFor] ? 'Enviando…' : 'Enviar sugestão'}
            </SolidButton>
          </div>
        </Modal>
      )}

      <div className={styles.totalSection}>
        {!loading &&
          (() => {
            const approvableGroups = groups.filter(g => g.proposed_by === 'admin');
            if (approvableGroups.length === 0) return null; // nada a exibir

            const approvableTotal = approvableGroups.reduce((sum, g) => {
              if (typeof g.collection_fee === 'number') {
                return sum + g.collection_fee * g.vehicle_count;
              }
              return sum;
            }, 0);
            const approvableCount = approvableGroups.reduce((sum, g) => sum + g.vehicle_count, 0);

            return `Total a pagar (${approvableCount} veículo(s)): ${approvableTotal.toLocaleString(
              'pt-BR',
              { style: 'currency', currency: 'BRL' }
            )}`;
          })()}
      </div>

      {(() => {
        const approvableGroups = groups.filter(g => g.proposed_by === 'admin');
        return approvableGroups.length > 0 ? (
          <div className={styles.confirmSection}>
            <SolidButton
              onClick={handleApproveAll}
              aria-busy={busyApprove}
              disabled={!approvableGroups.length || loading || busyApprove}
            >
              {busyApprove ? 'Confirmando…' : 'Confirmar a coleta dos veículos'}
            </SolidButton>
          </div>
        ) : null;
      })()}

      {/*  <div style={{ marginTop: 24 }}>
        <CalendarMonth highlightDates={highlightDates} />
      </div> */}

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

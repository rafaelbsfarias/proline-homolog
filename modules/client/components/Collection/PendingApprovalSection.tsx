import React, { useState } from 'react';
import { usePendingApprovalVehicles } from '@/modules/client/hooks/usePendingApprovalVehicles';
import RejectionModal from './RejectionModal';
import RescheduleModal from './RescheduleModal';
import { makeLocalIsoDate } from '@/modules/client/utils/date';

// Os modais serão importados aqui no futuro
// import { RejectionModal } from './RejectionModal';
// import { RescheduleModal } from './RescheduleModal';

const PendingApprovalSection = () => {
  const { groups, loading, error, handleApprove, handleReject, handleReschedule } =
    usePendingApprovalVehicles();
  const [showRejectionModalFor, setShowRejectionModalFor] = useState<string | null>(null);
  const [showRescheduleModalFor, setShowRescheduleModalFor] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const [rescheduling, setRescheduling] = useState(false);
  const todayIso = makeLocalIsoDate();

  if (loading) return <p>Carregando propostas de coleta...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;
  if (groups.length === 0) return null; // Não renderiza nada se não houver propostas

  return (
    <div className="collection-section">
      <h3>Aprovação de Nova Data</h3>
      <p>Analise as propostas abaixo e escolha uma ação.</p>
      {groups.map(group => (
        <details
          key={`${group.addressId}|${group.collection_date || ''}`}
          className="proposal-card"
          open
        >
          <summary style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
            <span>
              <b>Endereço:</b> {group.address}
            </span>
            <span>
              <b>Veículos:</b> {group.vehicle_count}
            </span>
            <span>
              <b>Data sugerida:</b>{' '}
              {group.collection_date
                ? new Date(group.collection_date).toLocaleDateString('pt-BR')
                : 'A definir'}
            </span>
            <span>
              <b>Origem:</b> {group.proposed_by === 'client' ? 'Cliente' : 'Admin'}
            </span>
            <span>
              <b>Custo:</b>{' '}
              {group.collection_fee
                ? group.collection_fee.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })
                : 'A definir'}
            </span>
          </summary>
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: '0.95rem', color: '#444' }}>
              {group.original_date && (
                <div>
                  <b>Data original:</b> {new Date(group.original_date).toLocaleDateString('pt-BR')}
                </div>
              )}
            </div>
            <div className="actions" style={{ marginTop: 12 }}>
              <button onClick={() => handleApprove(group.addressId)}>Aprovar</button>
              <button onClick={() => setShowRejectionModalFor(group.addressId)}>Rejeitar</button>
              <button onClick={() => setShowRescheduleModalFor(group.addressId)}>
                Sugerir Nova Data
              </button>
            </div>
          </div>
        </details>
      ))}
      {/* Modais */}
      <RejectionModal
        open={!!showRejectionModalFor}
        loading={rejecting}
        onClose={() => setShowRejectionModalFor(null)}
        onSubmit={async (reason: string) => {
          if (!showRejectionModalFor) return;
          setRejecting(true);
          try {
            await handleReject(showRejectionModalFor, reason);
            setShowRejectionModalFor(null);
          } finally {
            setRejecting(false);
          }
        }}
      />

      <RescheduleModal
        open={!!showRescheduleModalFor}
        loading={rescheduling}
        onClose={() => setShowRescheduleModalFor(null)}
        onSubmit={async (date: string) => {
          if (!showRescheduleModalFor) return;
          setRescheduling(true);
          try {
            await handleReschedule(showRescheduleModalFor, date);
            setShowRescheduleModalFor(null);
          } finally {
            setRescheduling(false);
          }
        }}
        minIso={todayIso}
        disabledDatesIso={(() => {
          const g = groups.find(x => x.addressId === showRescheduleModalFor);
          const arr: string[] = [];
          if (g?.collection_date) arr.push(g.collection_date);
          if ((g as any)?.original_date) arr.push((g as any).original_date as string);
          return arr.filter(Boolean) as string[];
        })()}
      />
    </div>
  );
};

export default PendingApprovalSection;

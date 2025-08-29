'use client';

import React, { useEffect, useState } from 'react';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';
import { makeLocalIsoDate } from '@/modules/client/utils/date';
import { CollectionSummary, RescheduleFlow, CalendarMonth } from './collection';

type Group = {
  addressId: string;
  address: string;
  vehicle_count: number;
  collection_fee: number | null;
  collection_date: string | null; // ISO
};

interface VehicleCollectionSectionProps {
  onLoadingChange?: (loading: boolean) => void;
}

const VehicleCollectionSection: React.FC<VehicleCollectionSectionProps> = ({ onLoadingChange }) => {
  const { get, post } = useAuthenticatedFetch();
  const [loading, setLoading] = useState(true);

  // resumo/valores
  const [approvalTotal, setApprovalTotal] = useState<number>(0);
  const [count, setCount] = useState<number>(0);

  // grupos por endereço para a mensagem
  const [groups, setGroups] = useState<Group[]>([]);

  // marcar dias no calendário
  const [highlightDates, setHighlightDates] = useState<string[]>([]);

  // UI: reagendamento
  const [rescheduleOpenFor, setRescheduleOpenFor] = useState<string | null>(null);

  const minIso = makeLocalIsoDate();

  const loadSummary = async () => {
    setLoading(true);
    onLoadingChange?.(true);
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
    onLoadingChange?.(false);
  };

  useEffect(() => {
    loadSummary();
  }, []);

  return (
    <div className="vehicle-counter">
      <div className="counter-header">
        <div className="counter-content" style={{ width: '100%' }}>
          <CollectionSummary
            data={{
              approvalTotal,
              count,
              groups,
              highlightDates,
            }}
            loading={loading}
            onRescheduleClick={addressId =>
              setRescheduleOpenFor(rescheduleOpenFor === addressId ? null : addressId)
            }
            onApproveClick={async () => {
              if (!groups.length) return;
              // aprova por endereço
              for (const g of groups) {
                await post('/api/client/collection-approve', { addressId: g.addressId });
              }
              await loadSummary();
            }}
          />

          {/* Campo de data (canto direito) quando o cliente escolher "Sugerir outra data" */}
          <RescheduleFlow
            isOpen={!!rescheduleOpenFor}
            addressId={rescheduleOpenFor}
            onClose={() => setRescheduleOpenFor(null)}
            onRescheduleSuccess={async () => {
              await loadSummary();
            }}
            minIso={minIso}
          />
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

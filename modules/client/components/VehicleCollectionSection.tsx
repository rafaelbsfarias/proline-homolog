'use client';

import React, { useEffect, useState } from 'react';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';
import { formatDateBR, makeLocalIsoDate } from '@/modules/client/utils/date';
import { CollectionSummary, RescheduleFlow } from './collection';

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

  // UI: reagendamento e pagamento
  const [rescheduleOpenFor, setRescheduleOpenFor] = useState<string | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'boleto' | 'cartao' | 'qrcode'>('boleto');

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
              setShowPayment(true);
              await loadSummary();
            }}
          />

          {/* Campo de data (canto direito) quando o cliente escolher "Sugerir outra data" */}
          <RescheduleFlow
            isOpen={!!rescheduleOpenFor}
            addressId={rescheduleOpenFor}
            onClose={() => setRescheduleOpenFor(null)}
            onRescheduleSuccess={async () => {
              setShowPayment(false);
              await loadSummary();
            }}
            minIso={minIso}
          />
        </div>

        <div className="counter-actions" />
      </div>

      {/* Meios de pagamento (frontend) — exibidos somente após confirmar a coleta */}
      {showPayment && (
        <div className="collection-controls" style={{ marginTop: 12 }}>
          <div className="row">
            <label htmlFor="payment-method">Forma de pagamento:</label>
            <select
              id="payment-method"
              value={paymentMethod}
              onChange={e => setPaymentMethod(e.target.value as 'boleto' | 'cartao' | 'qrcode')}
              aria-label="Selecionar forma de pagamento"
            >
              <option value="boleto">Boleto</option>
              <option value="cartao">Cartão</option>
              <option value="qrcode">QR Code</option>
            </select>
          </div>

          {paymentMethod === 'boleto' && (
            <div style={{ marginTop: 8, opacity: 0.9 }}>
              O boleto será gerado após a aprovação. (mock)
            </div>
          )}

          {paymentMethod === 'cartao' && (
            <div style={{ marginTop: 8, opacity: 0.9 }}>
              Pagamento com cartão (mock).
              <br />
              <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                <input placeholder="Número do cartão" />
                <input placeholder="MM/AA" style={{ width: 90 }} />
                <input placeholder="CVV" style={{ width: 80 }} />
              </div>
            </div>
          )}

          {paymentMethod === 'qrcode' && (
            <div style={{ marginTop: 8, opacity: 0.9 }}>
              Exibir QR Code (mock) para pagamento instantâneo.
            </div>
          )}
        </div>
      )}

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

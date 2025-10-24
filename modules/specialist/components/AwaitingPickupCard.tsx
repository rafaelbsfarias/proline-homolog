import React, { useState } from 'react';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';
import { SolidButton } from '@/modules/common/components/SolidButton/SolidButton';
import { OutlineButton } from '@/modules/common/components/OutlineButton/OutlineButton';
import { LuChevronDown, LuChevronUp } from 'react-icons/lu';
import styles from './AwaitingPickupCard.module.css';

type Item = {
  requestId: string;
  requestStatus: string;
  vehicleId: string;
  plate: string;
  brand: string;
  model: string;
  year?: string;
  clientId: string;
  clientName: string | null;
  desiredDate: string | null;
  windowStart: string | null;
  windowEnd: string | null;
  isDelivery?: boolean; // Flag para diferenciar entrega/retirada
};

interface Props {
  items: Item[];
  loading?: boolean;
  onRefresh?: () => void;
}

// styles moved to CSS module

function formatDateRange(start?: string | null, end?: string | null) {
  if (!start || !end) return '-';
  const fmt = (iso: string) => new Date(iso).toLocaleString('pt-BR', { timeZone: 'UTC' });
  return `${fmt(start)} – ${fmt(end)}`;
}

const AwaitingPickupCard: React.FC<Props> = ({ items, loading, onRefresh }) => {
  const { authenticatedFetch } = useAuthenticatedFetch();
  const hasItems = items && items.length > 0;
  const [open, setOpen] = useState(false);

  const handleMarkDelivered = async (requestId: string) => {
    const resp = await authenticatedFetch(`/api/specialist/deliveries/${requestId}`, {
      method: 'PATCH',
      body: JSON.stringify({ action: 'mark_delivered' }),
    });
    if (!resp.ok) throw new Error(resp.error || 'Falha ao marcar retirada');
    onRefresh?.();
  };

  return (
    <div className={styles.card}>
      <div className={styles.header} onClick={() => setOpen(o => !o)} aria-expanded={open}>
        <h3 className={styles.title}>
          Entregas/Retiradas Agendadas {hasItems ? `(${items.length})` : ''}
        </h3>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <OutlineButton
            onClick={e => {
              e.stopPropagation();
              onRefresh?.();
            }}
            disabled={loading}
          >
            Atualizar
          </OutlineButton>
          {open ? <LuChevronUp /> : <LuChevronDown />}
        </div>
      </div>

      {open && (
        <div className={styles.body}>
          {!hasItems ? (
            <p className={styles.empty}>Nenhuma entrega/retirada pendente.</p>
          ) : (
            <div className={styles.list}>
              {items.map(item => {
                const actionLabel = item.isDelivery ? 'Entrega Realizada' : 'Retirada Realizada';
                const typeLabel = item.isDelivery ? 'Entrega' : 'Retirada';
                const disabledTooltip =
                  item.requestStatus !== 'scheduled'
                    ? `Ação disponível apenas para ${item.isDelivery ? 'entregas' : 'retiradas'} agendadas`
                    : actionLabel;

                return (
                  <div key={item.requestId} className={styles.item}>
                    <div>
                      <div className={styles.vehicleTitle}>
                        {item.plate} — {item.brand} {item.model}
                        {item.year ? ` (${item.year})` : ''}
                        <span style={{ marginLeft: 8, fontSize: '0.9em', color: '#666' }}>
                          {typeLabel}
                        </span>
                      </div>
                      <div className={styles.meta}>Cliente: {item.clientName || '—'}</div>
                    </div>
                    <div>
                      <div className={styles.meta}>
                        Janela: {formatDateRange(item.windowStart, item.windowEnd)}
                      </div>
                      <div className={styles.meta}>Solicitado: {item.desiredDate || '—'}</div>
                    </div>
                    <div className={styles.actions}>
                      <SolidButton
                        onClick={() => handleMarkDelivered(item.requestId)}
                        disabled={loading || item.requestStatus !== 'scheduled'}
                        title={disabledTooltip}
                      >
                        {actionLabel}
                      </SolidButton>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AwaitingPickupCard;

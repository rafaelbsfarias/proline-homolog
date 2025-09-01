import React from 'react';
import { CollectionGroupItemProps } from '../types';
import { formatDateBR } from '@/modules/client/utils/date';

const CollectionGroupItem: React.FC<CollectionGroupItemProps> = ({
  group,
  onRescheduleClick,
  onAcceptProposal,
  onRejectProposal,
}) => {
  const requiresApproval = group.proposed_by === 'admin' && group.collection_date;
  const hasOriginalDate = group.original_date && group.collection_date !== group.original_date;

  return (
    <div
      key={group.addressId}
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12,
        marginBottom: 8,
      }}
    >
      <span>
        - localizados no endereço {group.address || group.addressId} no dia{' '}
        {group.collection_date ? formatDateBR(group.collection_date) : 'a definir'}
        {hasOriginalDate && (
          <span style={{ color: '#666', fontSize: '0.9em' }}>
            {' '}
            (original: {formatDateBR(group.original_date!)})
          </span>
        )}
        {typeof group.collection_fee === 'number' && (
          <>
            {' '}
            no valor de{' '}
            {(group.collection_fee * group.vehicle_count).toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            })}
          </>
        )}
      </span>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {requiresApproval && (
          <>
            <button
              className="refresh-button"
              style={{ backgroundColor: '#4CAF50', color: 'white' }}
              onClick={() => onAcceptProposal?.(group.addressId)}
              title="Aceitar proposta de data"
            >
              ✓ Aceitar
            </button>
            <button
              className="refresh-button"
              style={{ backgroundColor: '#f44336', color: 'white' }}
              onClick={() => onRejectProposal?.(group.addressId)}
              title="Rejeitar proposta de data"
            >
              ✗ Rejeitar
            </button>
          </>
        )}
        <button
          className="refresh-button"
          onClick={() => onRescheduleClick(group.addressId)}
          title="Sugerir outra data para este endereço"
        >
          Sugerir outra data
        </button>
      </div>
    </div>
  );
};

export default CollectionGroupItem;

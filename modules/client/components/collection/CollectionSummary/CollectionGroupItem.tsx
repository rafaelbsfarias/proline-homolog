import React from 'react';
import { CollectionGroupItemProps } from '../types';
import { formatDateBR } from '@/modules/client/utils/date';

const CollectionGroupItem: React.FC<CollectionGroupItemProps> = ({ group, onRescheduleClick }) => {
  return (
    <div
      key={group.addressId}
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <span>
        - localizados no endereço {group.address || group.addressId} no dia{' '}
        {group.collection_date ? formatDateBR(group.collection_date) : 'a definir'}
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
      <span>
        <button
          className="refresh-button"
          onClick={() => onRescheduleClick(group.addressId)}
          title="Sugerir outra data para este endereço"
        >
          Sugerir outra data
        </button>
      </span>
    </div>
  );
};

export default CollectionGroupItem;

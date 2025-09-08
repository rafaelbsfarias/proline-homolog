import React from 'react';
import type { Method, AddressItem } from '@/modules/client/types';
import style from './BulkCollectionControls.module.css';
import Radio from '@/modules/common/components/Radio/Radio';

interface Props {
  method: Method;
  setMethod: (m: Method) => void;
  addressId: string;
  setAddressId: (id: string) => void;
  saving: boolean;
  onOpenModal: (m: Method) => void;
  addresses: AddressItem[];
}

export default function BulkCollectionControls({
  method,
  setMethod,
  addressId,
  setAddressId,
  saving,
  onOpenModal,
  addresses,
}: Props) {
  return (
    <div className="collection-controls" aria-label="Opções de coleta em lote">
      <h4 className={style.header}>Opções de coleta em lote</h4>
      <div className="row">
        <Radio
          name="bulkMethod"
          label="Ponto de Coleta"
          value="collect_point"
          checked={method === 'collect_point'}
          onChange={() => setMethod('collect_point')}
        />
        <Radio
          name="bulkMethod"
          label="Vou levar ao pátio ProLine"
          value="bring_to_yard"
          checked={method === 'bring_to_yard'}
          onChange={() => setMethod('bring_to_yard')}
        />
      </div>
      {method === 'collect_point' ? (
        <div className="row">
          <select value={addressId} onChange={e => setAddressId(e.target.value)}>
            <option value="">Selecione um ponto de coleta</option>
            {(addresses || [])
              .filter(a => a.is_collect_point)
              .map(a => (
                <option key={a.id} value={a.id}>
                  {a.street} {a.number ? `, ${a.number}` : ''} {a.city ? `- ${a.city}` : ''}
                </option>
              ))}
          </select>
          <button
            className="save-button"
            disabled={!addressId || saving}
            onClick={() => onOpenModal('collect_point')}
          >
            Definir ponto de coleta em lote
          </button>
        </div>
      ) : (
        <div className="row">
          <button
            className="save-button"
            disabled={saving}
            onClick={() => onOpenModal('bring_to_yard')}
          >
            Levar ao pátio em lote
          </button>
        </div>
      )}
    </div>
  );
}

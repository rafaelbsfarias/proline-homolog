import React from 'react';
import type { Method, AddressItem } from '@/modules/client/types';
import styles from './BulkCollectionControls.module.css';
import Radio from '@/modules/common/components/Radio/Radio';
import Select from '@/modules/common/components/Select/Select';
import { SolidButton } from '@/modules/common/components/SolidButton/SolidButton';

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
  const addressOptions = (addresses || [])
    .filter(a => a.is_collect_point)
    .map(a => ({
      value: a.id,
      label: `${a.street}${a.number ? `, ${a.number}` : ''}${a.city ? ` - ${a.city}` : ''}`,
    }));

  // Se não houver opções, exibe um placeholder
  if (addressOptions.length === 0) {
    addressOptions.push({
      value: '',
      label: 'Nenhum ponto de coleta disponível',
    });
  }

  return (
    <div className="collection-controls" aria-label="Opções de coleta em lote">
      <h4 className={styles.header}>Opções de coleta em lote</h4>
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
        <div className={styles.row}>
          <Select
            id="collect-point-address"
            name="collect-point-address"
            placeholder="Selecione um ponto de coleta"
            value={addressId}
            onChange={e => setAddressId(e.target.value)}
            options={addressOptions}
          />
          <SolidButton
            className={styles.solidButtonCustom}
            disabled={!addressId || saving}
            onClick={() => onOpenModal('collect_point')}
          >
            Definir ponto de coleta em lote
          </SolidButton>
        </div>
      ) : (
        <div className={styles.row}>
          <SolidButton
            className={styles.solidButtonCustom}
            disabled={saving}
            onClick={() => onOpenModal('bring_to_yard')}
          >
            Levar ao pátio em lote
          </SolidButton>
        </div>
      )}
    </div>
  );
}

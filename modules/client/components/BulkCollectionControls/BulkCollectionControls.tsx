import React from 'react';
import { useBulkCollection } from '@/modules/client/hooks/useBulkCollection';
import styles from './BulkCollectionControls.module.css';
import Radio from '@/modules/common/components/Radio/Radio';
import Select from '@/modules/common/components/Select/Select';
import { SolidButton } from '@/modules/common/components/SolidButton/SolidButton';
import BulkCollectionModal from '../modals/BulkCollectionModal/BulkCollectionModal';
import { makeLocalIsoDate } from '@/modules/client/utils/date';

interface Props {
  onSuccess: () => void;
}

export default function BulkCollectionControls({ onSuccess }: Props) {
  const {
    loading,
    allVehicles,
    addresses,
    statusCounts,
    method,
    setMethod,
    addressId,
    setAddressId,
    modalOpen,
    openModal,
    closeModal,
    handleApply,
  } = useBulkCollection({ onSuccess });

  const addressOptions = (addresses || [])
    .filter(a => a.is_collect_point)
    .map(a => ({
      value: a.id,
      label: `${a.street}${a.number ? `, ${a.number}` : ''}${a.city ? ` - ${a.city}` : ''}`,
    }));

  if (addressOptions.length === 0) {
    addressOptions.push({
      value: '',
      label: 'Nenhum ponto de coleta disponível',
    });
  }

  const minDateIsoLocal = makeLocalIsoDate();

  return (
    <>
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
              disabled={loading}
            />
            <SolidButton
              className={styles.solidButtonCustom}
              disabled={!addressId || loading}
              onClick={() => openModal('collect_point')}
            >
              Definir ponto de coleta em lote
            </SolidButton>
          </div>
        ) : (
          <div className={styles.row}>
            <SolidButton
              className={styles.solidButtonCustom}
              disabled={loading}
              onClick={() => openModal('bring_to_yard')}
            >
              Levar ao pátio em lote
            </SolidButton>
          </div>
        )}
      </div>

      {modalOpen && (
        <BulkCollectionModal
          isOpen={!!modalOpen}
          onClose={closeModal}
          method={modalOpen}
          vehicles={allVehicles}
          addresses={addresses}
          minDate={minDateIsoLocal}
          initialAddressId={method === 'collect_point' ? addressId : undefined}
          statusCounts={statusCounts}
          onApply={handleApply}
        />
      )}
    </>
  );
}

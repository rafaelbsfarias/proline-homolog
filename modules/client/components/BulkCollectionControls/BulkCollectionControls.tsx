import React, { useState, useCallback, useEffect } from 'react';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';
import type { Method, Vehicle } from '@/modules/client/types';

import styles from './BulkCollectionControls.module.css';
import Radio from '@/modules/common/components/Radio/Radio';
import Select from '@/modules/common/components/Select/Select';
import { SolidButton } from '@/modules/common/components/SolidButton/SolidButton';
import BulkCollectionModal from '../Modals/BulkCollectionModal/BulkCollectionModal';
import { makeLocalIsoDate } from '@/modules/client/utils/date';

import { AddressItem } from '@/modules/client/types';

interface Props {
  onSuccess: () => void;
  addresses: AddressItem[];
  collectPoints: AddressItem[];
}

export default function BulkCollectionControls({ onSuccess, addresses, collectPoints }: Props) {
  const { get, post } = useAuthenticatedFetch();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allVehicles, setAllVehicles] = useState<Vehicle[]>([]);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [method, setMethod] = useState<Method>('collect_point');
  const [addressId, setAddressId] = useState('');
  const [eta, setEta] = useState('');
  const [modalOpen, setModalOpen] = useState<Method | null>(null);

  const refetch = useCallback(() => {
    const fetchInfo = async () => {
      setLoading(true);
      try {
        const response = await get<any>('/api/client/bulk-collection-info');
        if (response.ok && response.data) {
          setAllVehicles(response.data.vehicles || []);
          setStatusCounts(response.data.statusCounts || {});
        } else {
          setError(response.error || 'Erro ao buscar informações para coleta em lote.');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro de rede.');
      } finally {
        setLoading(false);
      }
    };
    fetchInfo();
  }, [get]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const handleApply = useCallback(
    async (payload: {
      method: Method;
      vehicleIds: string[];
      addressId?: string;
      estimated_arrival_date?: string;
    }) => {
      const resp = await post('/api/client/set-vehicles-collection', payload);
      if (!resp.ok) throw new Error(resp.error || 'Erro ao aplicar alterações em lote.');
      if (onSuccess) {
        onSuccess();
      }
      refetch(); // Refetch data after applying changes
    },
    [post, onSuccess, refetch]
  );

  const openModal = (method: Method) => {
    setModalOpen(method);
  };

  const closeModal = () => {
    setModalOpen(null);
  };

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
        <div className={styles.row}>
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

import React, { useState, useMemo } from 'react';
import { usePendingDefinitionVehicles } from '@/modules/client/hooks/usePendingDefinitionVehicles';
import { useAddresses } from '@/modules/client/hooks/useAddresses';
import styles from './Collection.module.css';
import { useToast } from '@/modules/common/components/ToastProvider';

const PendingDefinitionSection = () => {
  const { vehicles, loading, error, setCollectionMethod } = usePendingDefinitionVehicles();
  const { collectPoints, loading: loadingAddresses } = useAddresses();
  const [selectedVehicleIds, setSelectedVehicleIds] = useState<string[]>([]);
  const [collectionType, setCollectionType] = useState<'collect_point' | 'bring_to_yard'>(
    'collect_point'
  );
  const [addressId, setAddressId] = useState<string>('');
  const [estimatedDate, setEstimatedDate] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSelectVehicle = (id: string) => {
    setSelectedVehicleIds(prev =>
      prev.includes(id) ? prev.filter(vid => vid !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedVehicleIds.length === vehicles.length) {
      setSelectedVehicleIds([]);
    } else {
      setSelectedVehicleIds(vehicles.map(v => v.id));
    }
  };

  const { showToast } = useToast();

  const handleSubmit = async () => {
    if (selectedVehicleIds.length === 0) {
      showToast('warning', 'Selecione ao menos um veículo.');
      return;
    }
    if (collectionType === 'collect_point' && !addressId) {
      showToast('warning', 'Selecione um ponto de coleta.');
      return;
    }
    if (collectionType === 'bring_to_yard' && !estimatedDate) {
      showToast('warning', 'Informe a data estimada para levar ao pátio.');
      return;
    }

    setIsSubmitting(true);
    const result = await setCollectionMethod({
      vehicleIds: selectedVehicleIds,
      method: collectionType,
      addressId: collectionType === 'collect_point' ? addressId : undefined,
      estimated_arrival_date: collectionType === 'bring_to_yard' ? estimatedDate : undefined,
    });

    if (result.success) {
      showToast('success', 'Método de coleta definido com sucesso!');
      setSelectedVehicleIds([]);
      setAddressId('');
      setEstimatedDate('');
    } else {
      showToast('error', `Erro: ${result.error}`);
    }
    setIsSubmitting(false);
  };

  const allSelected = useMemo(
    () => selectedVehicleIds.length > 0 && selectedVehicleIds.length === vehicles.length,
    [selectedVehicleIds, vehicles]
  );

  if (loading) return <p>Carregando veículos aguardando definição...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;
  if (vehicles.length === 0) return null;

  return (
    <div className={styles.collectionSection}>
      <h3>Definir Coleta/Entrega</h3>
      <p>
        Os veículos abaixo precisam que você defina um ponto de coleta ou agende a entrega em um
        pátio Proline.
      </p>

      <div className={styles.vehicleList}>
        <div className={styles.listHeader}>
          <input
            type="checkbox"
            checked={allSelected}
            onChange={handleSelectAll}
            aria-label="Selecionar todos os veículos"
          />
          <span>Veículo</span>
          <span>Placa</span>
        </div>
        {vehicles.map(v => (
          <div key={v.id} className={styles.vehicleItem}>
            <input
              type="checkbox"
              checked={selectedVehicleIds.includes(v.id)}
              onChange={() => handleSelectVehicle(v.id)}
            />
            <span>
              {v.brand} {v.model}
            </span>
            <span>{v.plate}</span>
          </div>
        ))}
      </div>

      {selectedVehicleIds.length > 0 && (
        <div className={styles.actions}>
          <h4>Ação para {selectedVehicleIds.length} veículo(s) selecionado(s)</h4>
          <div className={styles.radioGroup}>
            <label>
              <input
                type="radio"
                name="collectionType"
                value="collect_point"
                checked={collectionType === 'collect_point'}
                onChange={() => setCollectionType('collect_point')}
              />
              Solicitar coleta em um ponto
            </label>
            <label>
              <input
                type="radio"
                name="collectionType"
                value="bring_to_yard"
                checked={collectionType === 'bring_to_yard'}
                onChange={() => setCollectionType('bring_to_yard')}
              />
              Levar ao pátio Proline
            </label>
          </div>

          {collectionType === 'collect_point' && (
            <div className={styles.inlineControls}>
              <label>
                Ponto de coleta:
                <select
                  value={addressId}
                  onChange={e => setAddressId(e.target.value)}
                  disabled={loadingAddresses}
                >
                  <option value="">Selecione</option>
                  {collectPoints.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.street} {p.number} - {p.city}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}

          {collectionType === 'bring_to_yard' && (
            <div className={styles.inlineControls}>
              <label>
                Data estimada para entrega no pátio:
                <input
                  type="date"
                  value={estimatedDate}
                  onChange={e => setEstimatedDate(e.target.value)}
                />
              </label>
            </div>
          )}

          <button className={styles.button} onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Enviando...' : 'Confirmar e Enviar'}
          </button>
        </div>
      )}
    </div>
  );
};

export default PendingDefinitionSection;

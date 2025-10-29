import React, { useEffect, useState } from 'react';
import Modal from '@/modules/common/components/Modal/Modal';
import Checkbox from '@/modules/common/components/Checkbox/Checkbox';
import { SolidButton } from '@/modules/common/components/SolidButton/SolidButton';
import { OutlineButton } from '@/modules/common/components/OutlineButton/OutlineButton';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  availableStatuses: string[];
  selectedStatuses: string[];
  onChangeStatuses: (statuses: string[]) => void;
  preparacao: boolean;
  comercializacao: boolean;
  onChangePreparacao: (val: boolean) => void;
  onChangeComercializacao: (val: boolean) => void;
  onClear: () => void;
  onApply: () => void;
}

const AdminVehicleFiltersModal: React.FC<Props> = ({
  isOpen,
  onClose,
  availableStatuses,
  selectedStatuses,
  onChangeStatuses,
  preparacao,
  comercializacao,
  onChangePreparacao,
  onChangeComercializacao,
  onClear,
  onApply,
}) => {
  const [localStatuses, setLocalStatuses] = useState<string[]>(selectedStatuses);
  const [localPrep, setLocalPrep] = useState<boolean>(preparacao);
  const [localCom, setLocalCom] = useState<boolean>(comercializacao);

  useEffect(() => {
    if (isOpen) {
      setLocalStatuses(selectedStatuses);
      setLocalPrep(preparacao);
      setLocalCom(comercializacao);
    }
  }, [isOpen, selectedStatuses, preparacao, comercializacao]);

  const toggleStatus = (s: string) => {
    setLocalStatuses(prev => (prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]));
  };

  const handleClear = () => {
    setLocalStatuses([]);
    setLocalPrep(false);
    setLocalCom(false);
    onClear();
  };

  const handleApply = () => {
    onChangeStatuses(localStatuses);
    onChangePreparacao(localPrep);
    onChangeComercializacao(localCom);
    onApply();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Filtrar Veículos" size="lg">
      <div style={{ display: 'grid', gap: 16 }}>
        <div>
          <label style={{ fontWeight: 600, display: 'block', marginBottom: 8 }}>Status</label>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: 8,
            }}
          >
            {availableStatuses.map(status => (
              <Checkbox
                key={status}
                id={`status-${status}`}
                name={`status-${status}`}
                label={status}
                checked={localStatuses.includes(status)}
                onChange={() => toggleStatus(status)}
              />
            ))}
          </div>
        </div>

        <div>
          <label style={{ fontWeight: 600, display: 'block', marginBottom: 8 }}>Fase</label>
          <div style={{ display: 'flex', gap: 16 }}>
            <Checkbox
              id="fase-prep"
              name="fase-prep"
              label="Preparação"
              checked={localPrep}
              onChange={() => setLocalPrep(v => !v)}
            />
            <Checkbox
              id="fase-com"
              name="fase-com"
              label="Comercialização"
              checked={localCom}
              onChange={() => setLocalCom(v => !v)}
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
          <OutlineButton type="button" onClick={handleClear}>
            Limpar Filtros
          </OutlineButton>
          <SolidButton type="button" onClick={handleApply}>
            Aplicar Filtros
          </SolidButton>
        </div>
      </div>
    </Modal>
  );
};

export default AdminVehicleFiltersModal;

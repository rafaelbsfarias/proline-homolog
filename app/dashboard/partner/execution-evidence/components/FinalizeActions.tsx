import React from 'react';
import { FaSave, FaCheck } from 'react-icons/fa';
import { ServiceWithEvidences } from '../types';
import { validateCanFinalize, getTooltipMessage } from '../utils/validations';
import styles from './FinalizeActions.module.css';

interface FinalizeActionsProps {
  services: ServiceWithEvidences[];
  onSave: () => void;
  onFinalize: () => void;
  saving: boolean;
}

export const FinalizeActions: React.FC<FinalizeActionsProps> = ({
  services,
  onSave,
  onFinalize,
  saving,
}) => {
  const { canFinalize, servicesWithoutEvidences, servicesNotCompleted } =
    validateCanFinalize(services);
  const tooltipMessage = getTooltipMessage(servicesWithoutEvidences, servicesNotCompleted);

  return (
    <div className={styles.actions}>
      <button onClick={onSave} disabled={saving} className={styles.saveButton}>
        <FaSave size={16} />
        {saving ? 'Salvando...' : 'Salvar Progresso'}
      </button>

      <div className={styles.finalizeContainer}>
        <button
          onClick={onFinalize}
          disabled={saving || !canFinalize}
          title={!canFinalize ? tooltipMessage : 'Finalizar execução do orçamento'}
          className={`${styles.finalizeButton} ${!canFinalize ? styles.disabled : ''}`}
        >
          <FaCheck size={16} />
          {saving ? 'Finalizando...' : 'Finalizar Execução'}
        </button>

        {!canFinalize && !saving && <div className={styles.tooltip}>⚠️ {tooltipMessage}</div>}
      </div>
    </div>
  );
};

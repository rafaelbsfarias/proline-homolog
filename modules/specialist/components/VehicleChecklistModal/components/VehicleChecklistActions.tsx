import React from 'react';
import { SolidButton } from '@/modules/common/components/SolidButton/SolidButton';
import styles from '../VehicleChecklistModal.module.css';

export interface VehicleChecklistActionsProps {
  isSubmitting: boolean;
  isFinalizing: boolean;
  isFinalized: boolean;
  error: string | null;
  success: string | null;
  onSubmit: (e: React.FormEvent) => void;
  onFinalize: () => void;
}

/**
 * Componente para as ações do checklist de veículo
 * Responsável apenas pela apresentação dos botões e mensagens de status
 * Segue o princípio da responsabilidade única
 */
const VehicleChecklistActions: React.FC<VehicleChecklistActionsProps> = ({
  isSubmitting,
  isFinalizing,
  isFinalized,
  error,
  success,
  onSubmit,
  onFinalize,
}) => {
  const isLoading = isSubmitting || isFinalizing;

  return (
    <>
      {/* Mensagens de erro e sucesso */}
      {error && <div className={styles.error}>{error}</div>}
      {success && <div className={styles.success}>{success}</div>}

      {/* Rodapé de Ações Fixo */}
      <div className={`${styles.actions} ${styles.actionsFooter}`}>
        <SolidButton
          type="submit"
          className={styles.saveButton}
          disabled={isLoading || isFinalized}
          onClick={onSubmit}
        >
          {isSubmitting ? 'Salvando...' : 'Salvar checklist'}
        </SolidButton>

        <SolidButton
          type="button"
          className={styles.finalizeButton}
          onClick={onFinalize}
          disabled={isLoading || isFinalized}
        >
          {isFinalizing ? 'Finalizando...' : 'Finalizar checklist'}
        </SolidButton>
      </div>
    </>
  );
};

export default VehicleChecklistActions;

/**
 * BudgetActions - Componente para ações do orçamento
 *
 * Responsabilidades:
 * - Botões de ação (salvar, limpar)
 * - Estados de loading
 * - Validação básica de UI
 */

import React from 'react';

interface BudgetActionsProps {
  onSave: () => void;
  onClear: () => void;
  canSave: boolean;
  isSaving: boolean;
  mode: 'create' | 'edit';
}

const BudgetActions: React.FC<BudgetActionsProps> = ({
  onSave,
  onClear,
  canSave,
  isSaving,
  mode,
}) => {
  return (
    <div style={{ marginTop: '24px', display: 'flex', gap: '12px', flexDirection: 'column' }}>
      <button
        onClick={onSave}
        disabled={!canSave || isSaving}
        style={{
          width: '100%',
          padding: '12px 24px',
          backgroundColor: canSave && !isSaving ? '#4caf50' : '#ccc',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '16px',
          fontWeight: '600',
          cursor: canSave && !isSaving ? 'pointer' : 'not-allowed',
          transition: 'background-color 0.2s',
        }}
      >
        {isSaving ? 'Salvando...' : mode === 'edit' ? 'Atualizar Orçamento' : 'Salvar Orçamento'}
      </button>
    </div>
  );
};

export default BudgetActions;

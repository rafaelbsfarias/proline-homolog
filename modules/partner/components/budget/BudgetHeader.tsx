/**
 * BudgetHeader - Componente para header do orçamento
 *
 * Responsabilidades:
 * - Exibir título baseado no modo (criar/editar)
 * - Mostrar mensagens de feedback
 * - Exibir informações de debug se necessário
 */

import React from 'react';

interface SaveMessage {
  type: 'success' | 'error';
  text: string;
}

interface BudgetHeaderProps {
  isEditing: boolean;
  quoteId: string | null;
  saveMessage: SaveMessage | null;
  error?: string | null;
}

const BudgetHeader: React.FC<BudgetHeaderProps> = ({ isEditing, quoteId, saveMessage, error }) => {
  return (
    <div style={{ marginBottom: '32px' }}>
      <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px' }}>
        {isEditing ? 'Editar Orçamento' : 'Criar Orçamento'}
      </h1>
      <p style={{ color: '#666', fontSize: '16px' }}>
        {isEditing
          ? 'Edite os serviços selecionados para este orçamento'
          : 'Selecione os serviços desejados para compor seu orçamento'}
      </p>

      {/* Mensagem de erro de carregamento */}
      {error && (
        <div
          style={{
            marginTop: '16px',
            padding: '12px 16px',
            borderRadius: '8px',
            backgroundColor: '#f8d7da',
            border: '1px solid #f5c6cb',
            color: '#721c24',
            fontSize: '14px',
            fontWeight: '500',
          }}
        >
          {error}
        </div>
      )}

      {/* Mensagem de save/update */}
      {saveMessage && (
        <div
          style={{
            marginTop: '16px',
            padding: '12px 16px',
            borderRadius: '8px',
            backgroundColor: saveMessage.type === 'success' ? '#d4edda' : '#f8d7da',
            border: `1px solid ${saveMessage.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`,
            color: saveMessage.type === 'success' ? '#155724' : '#721c24',
            fontSize: '14px',
            fontWeight: '500',
          }}
        >
          {saveMessage.text}
        </div>
      )}

      {/* Info do orçamento sendo editado */}
      {isEditing && quoteId && (
        <div
          style={{
            background: '#e3f2fd',
            border: '1px solid #2196f3',
            borderRadius: '8px',
            padding: '12px',
            marginTop: '16px',
          }}
        >
          <strong>Editando Orçamento ID:</strong> {quoteId}
        </div>
      )}
    </div>
  );
};

export default BudgetHeader;

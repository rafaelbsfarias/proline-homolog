import React from 'react';
import { CollectionSummaryProps } from '../types';
import CollectionGroupsList from './CollectionGroupsList';
import CollectionTotal from './CollectionTotal';

const CollectionSummary: React.FC<CollectionSummaryProps> = ({
  data,
  loading,
  onRescheduleClick,
  onApproveClick,
}) => {
  return (
    <div className="counter-content" style={{ width: '100%' }}>
      <h3>Coleta de Veículos</h3>

      {/* Mensagem guiada */}
      <div style={{ marginBottom: 8 }}>
        Prezado(a), sugerimos a coleta dos veículos
        <CollectionGroupsList groups={data.groups} onRescheduleClick={onRescheduleClick} />
      </div>

      {/* Total consolidado */}
      <CollectionTotal total={data.approvalTotal} count={data.count} />

      {/* Confirmar coleta → exibe meios de pagamento; status dos veículos passa para "COLETA APROVADA" */}
      <div style={{ marginTop: 8 }}>
        Para confirmar a coleta dos veículos clique
        <button
          className="refresh-button"
          style={{ marginLeft: 8 }}
          onClick={onApproveClick}
          disabled={!data.groups.length || loading}
        >
          aqui
        </button>
      </div>
    </div>
  );
};

export default CollectionSummary;

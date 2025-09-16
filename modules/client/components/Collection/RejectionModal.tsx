import React, { useState, useEffect } from 'react';
import BaseModal from './BaseModal';

interface Props {
  open: boolean;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void | Promise<void>;
}

const RejectionModal: React.FC<Props> = ({ open, loading = false, onClose, onSubmit }) => {
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (open) setReason('');
  }, [open]);

  return (
    <BaseModal open={open} onClose={onClose} title="Rejeitar Proposta">
      <p>Informe um motivo (opcional) para a rejeição.</p>
      <textarea
        value={reason}
        onChange={e => setReason(e.target.value)}
        rows={4}
        style={{ width: '100%', margin: '12px 0' }}
        placeholder="Opcional: detalhe o motivo"
      />
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button onClick={onClose} disabled={loading}>
          Cancelar
        </button>
        <button onClick={() => onSubmit(reason)} disabled={loading}>
          {loading ? 'Enviando...' : 'Confirmar Rejeição'}
        </button>
      </div>
    </BaseModal>
  );
};

export default RejectionModal;

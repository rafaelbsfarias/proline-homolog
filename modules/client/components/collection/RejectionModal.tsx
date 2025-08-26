import React, { useState, useEffect } from 'react';

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

  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
      }}
    >
      <div
        style={{ background: '#fff', padding: 16, borderRadius: 8, width: '100%', maxWidth: 480 }}
      >
        <h3>Rejeitar Proposta</h3>
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
      </div>
    </div>
  );
};

export default RejectionModal;

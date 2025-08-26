import React, { useState, useEffect } from 'react';

interface Props {
  open: boolean;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (date: string) => void | Promise<void>;
}

const RescheduleModal: React.FC<Props> = ({ open, loading = false, onClose, onSubmit }) => {
  const [date, setDate] = useState('');

  useEffect(() => {
    if (open) setDate('');
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
        style={{ background: '#fff', padding: 16, borderRadius: 8, width: '100%', maxWidth: 420 }}
      >
        <h3>Sugerir Nova Data</h3>
        <p>Informe uma nova data para a coleta.</p>
        <input type="date" value={date} onChange={e => setDate(e.target.value)} />
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
          <button onClick={onClose} disabled={loading}>
            Cancelar
          </button>
          <button onClick={() => onSubmit(date)} disabled={loading || !date}>
            {loading ? 'Enviando...' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RescheduleModal;

import React, { useState, useEffect } from 'react';
import DatePickerBR from '@/modules/common/components/DatePickerBR';
import { makeLocalIsoDate } from '@/modules/client/utils/date';

interface Props {
  open: boolean;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (date: string) => void | Promise<void>;
  minIso?: string;
  disabledDatesIso?: string[];
}

const RescheduleModal: React.FC<Props> = ({
  open,
  loading = false,
  onClose,
  onSubmit,
  minIso,
  disabledDatesIso,
}) => {
  const [date, setDate] = useState('');
  const today = makeLocalIsoDate();

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
        <DatePickerBR
          valueIso={date}
          onChangeIso={setDate}
          minIso={minIso || today}
          disabledDatesIso={disabledDatesIso}
          ariaLabel="Selecione a nova data"
        />
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

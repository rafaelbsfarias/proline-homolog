import React, { useState, useEffect } from 'react';
import DatePickerBR from '@/modules/common/components/DatePickerBR';
import { makeLocalIsoDate } from '@/modules/client/utils/date';
import BaseModal from './BaseModal';

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

  return (
    <BaseModal open={open} onClose={onClose} title="Sugerir Nova Data" maxWidth={420}>
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
    </BaseModal>
  );
};

export default RescheduleModal;

import React from 'react';
import DatePickerBR from '@/modules/common/components/DatePickerBR/DatePickerBR';

type Props = {
  addressLabel: string;
  initialDateIso?: string;
  loading?: boolean;
  error?: string;
  successMessage?: string;
  onChangeDate: (iso: string) => void;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
};

const ProposeCollectionDateModal: React.FC<Props> = ({
  addressLabel,
  initialDateIso = '',
  loading,
  error,
  successMessage,
  onChangeDate,
  onConfirm,
  onClose,
}) => {
  const [valueIso, setValueIso] = React.useState<string>(initialDateIso || '');

  React.useEffect(() => {
    setValueIso(initialDateIso || '');
  }, [initialDateIso]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
    >
      <div style={{ background: '#fff', padding: '1rem', borderRadius: 8, minWidth: 360 }}>
        <h4 style={{ marginTop: 0, marginBottom: '.5rem' }}>Propor nova data</h4>
        <p style={{ marginTop: 0 }}>Endereço: {addressLabel}</p>
        <div style={{ margin: '8px 0 16px' }}>
          <DatePickerBR
            valueIso={valueIso}
            onChangeIso={v => {
              setValueIso(v);
              onChangeDate(v);
            }}
          />
        </div>
        {error && <div style={{ color: '#b00020', marginBottom: 8 }}>{error}</div>}
        {successMessage && (
          <div style={{ color: '#0b8043', marginBottom: 8 }}>{successMessage}</div>
        )}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button type="button" disabled={!!loading} onClick={onClose}>
            Cancelar
          </button>
          <button type="button" disabled={!!loading || !valueIso} onClick={onConfirm}>
            {loading ? 'Enviando...' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProposeCollectionDateModal;

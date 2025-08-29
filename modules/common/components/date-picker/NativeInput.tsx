import React from 'react';

interface Props {
  inputClass?: string;
  valueIso: string;
  min: string;
  onChangeIso: (iso: string) => void;
  nativeRef: React.RefObject<HTMLInputElement | null>;
}

export const NativeInput: React.FC<Props> = ({
  inputClass,
  valueIso,
  min,
  onChangeIso,
  nativeRef,
}) => (
  <input
    ref={nativeRef}
    className={inputClass}
    type="date"
    value={valueIso || ''}
    min={min}
    onChange={e => onChangeIso(e.target.value)}
    aria-hidden
    tabIndex={-1}
    style={
      inputClass
        ? undefined
        : {
            position: 'absolute',
            left: '-9999px',
            width: 0,
            height: 0,
            opacity: 0,
            pointerEvents: 'none',
          }
    }
  />
);

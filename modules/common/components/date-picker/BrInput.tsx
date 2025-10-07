import React from 'react';
import { brToIso, isoToBr } from './utils';

interface BrInputProps {
  id?: string;
  className?: string;
  placeholder?: string;
  ariaLabel?: string;
  valueBr: string;
  setValueBr: (v: string) => void;
  valueIso: string;
  applyIso: (iso: string) => void;
}

export const BrInput: React.FC<BrInputProps> = ({
  id,
  className,
  placeholder,
  ariaLabel,
  valueBr,
  setValueBr,
  valueIso,
  applyIso,
}) => {
  return (
    <input
      id={id}
      className={className}
      placeholder={placeholder}
      inputMode="numeric"
      value={valueBr}
      onChange={e => setValueBr(e.target.value)}
      onBlur={() => {
        const iso = brToIso(valueBr);
        if (iso) applyIso(iso);
        else setValueBr(isoToBr(valueIso || ''));
      }}
      aria-label={ariaLabel}
    />
  );
};

import React from 'react';
import { brToIso, isoToBr } from './utils';

interface BrInputProps {
  className?: string;
  placeholder?: string;
  ariaLabel?: string;
  valueBr: string;
  setValueBr: (v: string) => void;
  valueIso: string;
  applyIso: (iso: string) => void;
}

export const BrInput: React.FC<BrInputProps> = ({
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

import React, { useMemo, useRef, useState, useEffect } from 'react';

interface Props {
  valueIso: string;
  minIso?: string;
  onChangeIso: (v: string) => void;
  placeholder?: string;
  ariaLabel?: string;
  containerClass?: string;
  inputClass?: string;
  buttonClass?: string;
  hiddenInputClass?: string;
}

const pad2 = (n: number) => String(n).padStart(2, '0');
const onlyDigits = (s: string) => s.replace(/\D+/g, '');

function isoToBR(iso: string): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  if (!y || !m || !d) return '';
  return `${d}/${m}/${y}`;
}

function parseBRToISO(input: string): string | '' {
  const digits = onlyDigits(input).slice(0, 8);
  if (digits.length < 8) return '';
  const d = parseInt(digits.slice(0, 2), 10);
  const m = parseInt(digits.slice(2, 4), 10);
  const y = parseInt(digits.slice(4, 8), 10);
  const dt = new Date(y, m - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) return '';
  return `${y}-${pad2(m)}-${pad2(d)}`;
}

function formatDigitsToBR(digits: string): string {
  const v = digits.slice(0, 8);
  const p1 = v.slice(0, 2);
  const p2 = v.slice(2, 4);
  const p3 = v.slice(4, 8);
  if (v.length <= 2) return p1;
  if (v.length <= 4) return `${p1}/${p2}`;
  return `${p1}/${p2}/${p3}`;
}

export default function DatePickerBR({ valueIso, minIso, onChangeIso, placeholder = 'dd/mm/aaaa', ariaLabel, containerClass, inputClass, buttonClass, hiddenInputClass }: Props) {
  const [valueBr, setValueBr] = useState<string>(isoToBR(valueIso));
  const ref = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setValueBr(isoToBR(valueIso));
  }, [valueIso]);

  return (
    <div className={containerClass}>
      <input
        className={inputClass}
        type="text"
        inputMode="numeric"
        placeholder={placeholder}
        value={valueBr}
        onChange={e => {
          const only = onlyDigits(e.target.value);
          const formatted = formatDigitsToBR(only);
          setValueBr(formatted);
          const iso = parseBRToISO(formatted);
          onChangeIso(iso);
        }}
        maxLength={10}
        aria-label={ariaLabel}
      />
      <button
        type="button"
        className={buttonClass}
        aria-label="Abrir calendário"
        onClick={() => {
          const el = ref.current;
          if (!el) return;
          // @ts-ignore
          if (typeof el.showPicker === 'function') el.showPicker(); else { el.focus(); el.click(); }
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M7 10h5v5H7z"></path>
          <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z"></path>
        </svg>
      </button>
      <input
        ref={ref}
        className={hiddenInputClass}
        type="date"
        value={valueIso}
        min={minIso}
        onChange={e => {
          const iso = e.target.value;
          onChangeIso(iso);
        }}
        aria-hidden
        tabIndex={-1}
      />
    </div>
  );
}

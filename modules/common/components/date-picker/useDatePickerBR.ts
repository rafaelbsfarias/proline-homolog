import { useEffect, useMemo, useRef, useState } from 'react';
import { brToIso, isoToBr, pad2, todayLocalIso, buildMonthDays } from './utils';

export interface UseDatePickerParams {
  valueIso: string;
  onChangeIso: (iso: string) => void;
  minIso?: string;
  disabledDatesIso?: string[];
}

export const useDatePickerBR = ({
  valueIso,
  onChangeIso,
  minIso,
  disabledDatesIso,
}: UseDatePickerParams) => {
  const nativeRef = useRef<HTMLInputElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const min = useMemo(() => minIso || todayLocalIso(), [minIso]);
  const disabledSet = useMemo(() => new Set(disabledDatesIso || []), [disabledDatesIso]);

  const [valueBr, setValueBr] = useState('');
  useEffect(() => setValueBr(isoToBr(valueIso || '')), [valueIso]);

  const applyIso = (iso: string) => {
    if (!iso) {
      onChangeIso('');
      return;
    }
    const clamped = iso < min ? min : iso;
    onChangeIso(clamped);
  };

  // Fallback calendar state
  const [fallbackOpen, setFallbackOpen] = useState(false);
  const [fallbackPos, setFallbackPos] = useState<{ top: number; left: number } | null>(null);
  const [viewYear, setViewYear] = useState<number>(() => {
    const d = valueIso || todayLocalIso();
    return Number(d.slice(0, 4));
  });
  const [viewMonth, setViewMonth] = useState<number>(() => {
    const d = valueIso || todayLocalIso();
    return Number(d.slice(5, 7)) - 1; // 0..11
  });

  const openPicker = () => {
    const el = nativeRef.current as any;
    let usedNative = false;
    if (el && typeof el.showPicker === 'function') {
      try {
        const rect =
          typeof el.getBoundingClientRect === 'function' ? el.getBoundingClientRect() : ({} as any);
        const w = rect?.width ?? 0;
        const h = rect?.height ?? 0;
        const style =
          typeof window !== 'undefined' && window.getComputedStyle
            ? window.getComputedStyle(el)
            : null;
        const visible =
          w > 0 && h > 0 && (!style || (style.visibility !== 'hidden' && style.opacity !== '0'));
        if (visible) {
          el.focus();
          el.showPicker();
          usedNative = true;
        }
      } catch {
        // ignore and fallback
      }
    }
    if (!usedNative) {
      const btn = buttonRef.current;
      if (btn) {
        const rect = btn.getBoundingClientRect();
        setFallbackPos({ top: rect.bottom + window.scrollY + 6, left: rect.left + window.scrollX });
      }
      setFallbackOpen(true);
    }
  };

  const closeFallback = () => setFallbackOpen(false);

  const gotoMonth = (delta: number) => {
    const next = new Date(viewYear, viewMonth + delta, 1);
    const nextIso = `${next.getFullYear()}-${pad2(next.getMonth() + 1)}-01`;
    if (nextIso < min.slice(0, 8) + '01') return; // não navegar antes do min mês
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
  };

  const days = buildMonthDays(viewYear, viewMonth, min, disabledSet);

  return {
    // props/state
    nativeRef,
    buttonRef,
    min,
    disabledSet,
    valueBr,
    setValueBr,
    applyIso,
    openPicker,
    fallbackOpen,
    fallbackPos,
    closeFallback,
    viewYear,
    viewMonth,
    gotoMonth,
    days,
  };
};

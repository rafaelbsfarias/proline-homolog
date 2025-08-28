import React from 'react';
import { useDatePickerBR } from './date-picker/useDatePickerBR';
import { BrInput } from './date-picker/BrInput';
import { CalendarButton } from './date-picker/CalendarButton';
import { NativeInput } from './date-picker/NativeInput';
import { CalendarPopover } from './date-picker/CalendarPopover';
import { isoToBr } from './date-picker/utils';

type Props = {
  valueIso: string;
  onChangeIso: (iso: string) => void;
  minIso?: string;
  containerClass?: string;
  inputClass?: string;
  buttonClass?: string;
  hiddenInputClass?: string;
  placeholder?: string;
  ariaLabel?: string;
};

export default function DatePickerBR({
  valueIso,
  onChangeIso,
  minIso,
  containerClass,
  inputClass,
  buttonClass,
  hiddenInputClass,
  placeholder = 'dd/mm/aaaa',
  ariaLabel,
}: Props) {
  const state = useDatePickerBR({ valueIso, onChangeIso, minIso });

  return (
    <div
      className={containerClass}
      style={{ position: 'relative', display: 'inline-flex', gap: '.5rem', alignItems: 'center' }}
    >
      <BrInput
        className={inputClass}
        placeholder={placeholder}
        ariaLabel={ariaLabel}
        valueBr={state.valueBr}
        setValueBr={state.setValueBr}
        valueIso={valueIso}
        applyIso={state.applyIso}
      />

      <CalendarButton
        className={buttonClass}
        onClick={state.openPicker}
        buttonRef={state.buttonRef}
      />

      <NativeInput
        inputClass={hiddenInputClass}
        valueIso={valueIso}
        min={state.min}
        onChangeIso={state.applyIso}
        nativeRef={state.nativeRef}
      />

      <CalendarPopover
        open={state.fallbackOpen}
        pos={state.fallbackPos}
        month={state.viewMonth}
        year={state.viewYear}
        days={state.days}
        onPrev={() => state.gotoMonth(-1)}
        onNext={() => state.gotoMonth(1)}
        onSelect={iso => {
          state.applyIso(iso);
          state.setValueBr(isoToBr(iso));
          state.closeFallback();
        }}
        onClose={state.closeFallback}
      />
    </div>
  );
}

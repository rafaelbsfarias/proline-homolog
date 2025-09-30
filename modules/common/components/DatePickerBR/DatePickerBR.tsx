import React from 'react';
import { useDatePickerBR } from '../date-picker/useDatePickerBR';
import { BrInput } from '../date-picker/BrInput';
import { CalendarButton } from '../date-picker/CalendarButton';
import { NativeInput } from '../date-picker/NativeInput';
import { CalendarPopover } from '../date-picker/CalendarPopover';
import { isoToBr } from '../date-picker/utils';
import brInputStyles from '../date-picker/BrInput.module.css';
import calendarButtonStyles from '../date-picker/CalendarButton.module.css';
import styles from './DatePickerBR.module.css';
import Label from '../Label/Label';

type Props = {
  valueIso: string;
  onChangeIso: (iso: string) => void;
  label?: string;
  id?: string;
  minIso?: string;
  disabledDatesIso?: string[];
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
  label,
  id,
  minIso,
  disabledDatesIso,
  containerClass,
  inputClass,
  buttonClass,
  hiddenInputClass,
  placeholder = 'dd/mm/aaaa',
  ariaLabel,
}: Props) {
  const state = useDatePickerBR({ valueIso, onChangeIso, minIso, disabledDatesIso });
  const inputId = id || 'date-picker';

  return (
    <div className={containerClass || ''}>
      {label && <Label htmlFor={inputId}>{label}</Label>}
      <div className={`${styles.datePickerWrapper}`}>
        <BrInput
          id={inputId}
          className={`${brInputStyles.brInput} ${inputClass || ''}`.trim()}
          placeholder={placeholder}
          ariaLabel={ariaLabel}
          valueBr={state.valueBr}
          setValueBr={state.setValueBr}
          valueIso={valueIso}
          applyIso={state.applyIso}
        />

        <CalendarButton
          className={`${calendarButtonStyles.calendarButton} ${buttonClass || ''}`.trim()}
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
      </div>

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

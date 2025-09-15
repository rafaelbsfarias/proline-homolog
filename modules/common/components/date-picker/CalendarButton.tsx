import React from 'react';
import { LuCalendarDays } from 'react-icons/lu';

interface Props {
  className?: string;
  onClick: () => void;
  buttonRef: React.RefObject<HTMLButtonElement | null>;
}

export const CalendarButton: React.FC<Props> = ({ className, onClick, buttonRef }) => (
  <button
    type="button"
    className={className}
    onClick={onClick}
    aria-label="Abrir calendário"
    ref={buttonRef}
  >
    <LuCalendarDays className="calendarIcon" />
  </button>
);

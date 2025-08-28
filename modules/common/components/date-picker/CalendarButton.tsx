import React from 'react';

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
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M7 10h5v5H7z"></path>
      <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z"></path>
    </svg>
  </button>
);

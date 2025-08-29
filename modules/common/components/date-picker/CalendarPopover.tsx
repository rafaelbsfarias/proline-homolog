import React from 'react';
import { createPortal } from 'react-dom';
import { DateCell, pad2, isoToBr } from './utils';

interface Props {
  open: boolean;
  pos: { top: number; left: number } | null;
  month: number; // 0..11
  year: number;
  days: DateCell[];
  onPrev: () => void;
  onNext: () => void;
  onSelect: (iso: string) => void;
  onClose: () => void;
}

export const CalendarPopover: React.FC<Props> = ({
  open,
  pos,
  month,
  year,
  days,
  onPrev,
  onNext,
  onSelect,
  onClose,
}) => {
  if (!open || !pos) return null;
  return createPortal(
    <div
      role="dialog"
      aria-label="Selecionar data"
      style={{
        position: 'absolute',
        top: pos.top,
        left: pos.left,
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: 8,
        padding: 8,
        zIndex: 10000,
        boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 6,
        }}
      >
        <button type="button" onClick={onPrev} aria-label="Mês anterior">
          ‹
        </button>
        <div style={{ fontWeight: 600 }}>
          {pad2(month + 1)}/{year}
        </div>
        <button type="button" onClick={onNext} aria-label="Próximo mês">
          ›
        </button>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: 4,
          marginBottom: 4,
          opacity: 0.8,
          fontSize: 12,
        }}
      >
        {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((w, i) => (
          <div key={i} style={{ textAlign: 'center' }}>
            {w}
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
        {days.map((cell, idx) =>
          cell.iso ? (
            <button
              key={cell.iso}
              type="button"
              disabled={cell.disabled}
              onClick={() => onSelect(cell.iso!)}
              style={{
                padding: '6px 0',
                borderRadius: 6,
                border: '1px solid #e5e7eb',
                background: cell.disabled ? '#f3f4f6' : '#fff',
                cursor: cell.disabled ? 'not-allowed' : 'pointer',
              }}
            >
              {cell.label}
            </button>
          ) : (
            <div key={`e-${idx}`} />
          )
        )}
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6 }}>
        <button type="button" onClick={onClose}>
          Fechar
        </button>
      </div>
    </div>,
    document.body
  );
};

'use client';

import React from 'react';
import { formatDateBR } from '@/modules/client/utils/date';

export interface CalendarMonthProps {
  highlightDates: string[];
}

/** Calendário simples do mês atual com destaque nas datas recebidas (YYYY-MM-DD) */
const CalendarMonth: React.FC<CalendarMonthProps> = ({ highlightDates }) => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0..11

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startWeekday = firstDay.getDay(); // 0=Dom
  const totalDays = lastDay.getDate();

  const days: (number | null)[] = [];
  for (let i = 0; i < startWeekday; i++) days.push(null);
  for (let d = 1; d <= totalDays; d++) days.push(d);

  const highlight = new Set(highlightDates || []);
  const fmt = (d: number) =>
    `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

  const cellStyle: React.CSSProperties = {
    border: '1px solid rgba(255,255,255,0.12)',
    minHeight: 56,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 600,
    borderRadius: 6,
  };

  return (
    <div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: 6,
          marginBottom: 8,
          opacity: 0.8,
        }}
      >
        {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((w, i) => (
          <div key={`${w}-${i}`} style={{ textAlign: 'center', fontWeight: 600 }}>
            {w}
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
        {days.map((d, idx) => {
          if (d === null) return <div key={`e-${idx}`} />;
          const dateStr = fmt(d);
          const isHighlight = highlight.has(dateStr);
          return (
            <div
              key={dateStr}
              style={{
                ...cellStyle,
                background: isHighlight ? 'rgba(76, 175, 80, 0.35)' : 'transparent',
              }}
              aria-label={dateStr}
              title={formatDateBR(dateStr)}
            >
              {d}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarMonth;

import React from 'react';
import { statusLabel } from '@/modules/client/utils/status';
import './StatusChips.css';

interface Props {
  counts: Record<string, number>;
  sorter: (a: [string, number], b: [string, number]) => number;
  onSelect: (status: string) => void;
}

export default function StatusChips({ counts, sorter, onSelect }: Props) {
  const entries = Object.entries(counts)
    .filter(([, c]) => c > 0)
    .sort(sorter);
  if (!entries.length) return null;
  return (
    <div className="status-chips" aria-label="Contadores por status">
      {entries.map(([s, c]) => (
        <button
          key={s}
          type="button"
          onClick={() => onSelect(s)}
          title={`Filtrar por ${statusLabel(s)}`}
          className="status-chip"
        >
          <span className="status-chip__label">{statusLabel(s)}</span>
          <span className="status-chip__count">{c}</span>
        </button>
      ))}
    </div>
  );
}

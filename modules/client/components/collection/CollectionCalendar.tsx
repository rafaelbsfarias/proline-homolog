'use client';

import React from 'react';
import { CalendarMonth } from '../collection';

interface CollectionCalendarProps {
  highlightDates: string[];
}

const CollectionCalendar: React.FC<CollectionCalendarProps> = ({ highlightDates }) => {
  return (
    <div
      style={{
        marginTop: 12,
        background: 'rgba(255,255,255,0.08)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 8,
        padding: 12,
      }}
    >
      <CalendarMonth highlightDates={highlightDates} />
    </div>
  );
};

export default CollectionCalendar;

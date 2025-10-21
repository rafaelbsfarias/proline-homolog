'use client';

import React from 'react';

const ObservationsSection: React.FC<{ observations?: string | null }> = ({ observations }) => {
  if (!observations) return null;
  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 10,
        boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
        padding: '24px',
        gridColumn: '1 / -1',
      }}
    >
      <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: 20, color: '#333' }}>
        Observações do Especialista
      </h2>
      <div
        style={{
          padding: '16px',
          background: '#f8f9fa',
          borderRadius: '8px',
          borderLeft: '4px solid #002E4C',
        }}
      >
        {observations}
      </div>
    </div>
  );
};

export default ObservationsSection;

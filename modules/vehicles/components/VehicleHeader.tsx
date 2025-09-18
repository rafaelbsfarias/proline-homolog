'use client';

import React from 'react';

export interface VehicleHeaderProps {
  title?: string;
  brand: string;
  model: string;
  plate: string;
  onBack?: () => void;
  evidenceCount?: number;
  onOpenImages?: () => void;
}

const VehicleHeader: React.FC<VehicleHeaderProps> = ({
  title = 'Detalhes do Veículo',
  brand,
  model,
  plate,
  onBack,
  evidenceCount = 0,
  onOpenImages,
}) => {
  return (
    <div style={{ marginBottom: '24px' }}>
      {onBack && (
        <button
          onClick={onBack}
          style={{
            padding: '8px 16px',
            background: '#ecf0f1',
            border: '1px solid #bdc3c7',
            borderRadius: '4px',
            cursor: 'pointer',
            marginBottom: '16px',
          }}
        >
          ← Voltar
        </button>
      )}
      <h1 style={{ fontSize: '2rem', fontWeight: 600, marginBottom: 8, color: '#333' }}>{title}</h1>
      <p style={{ color: '#666', fontSize: '1.15rem' }}>
        {brand} {model} • {plate}
      </p>

      {evidenceCount > 0 && onOpenImages && (
        <div style={{ marginTop: 12 }}>
          <button
            onClick={onOpenImages}
            style={{
              padding: '8px 16px',
              background: '#002E4C',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'background-color 0.2s ease',
            }}
            onMouseOver={e => {
              e.currentTarget.style.backgroundColor = '#001F36';
            }}
            onMouseOut={e => {
              e.currentTarget.style.backgroundColor = '#002E4C';
            }}
          >
            Ver Evidências ({evidenceCount})
          </button>
        </div>
      )}
    </div>
  );
};

export default VehicleHeader;

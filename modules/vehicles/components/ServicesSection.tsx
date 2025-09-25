'use client';

import React from 'react';
import { translateServiceCategory } from '@/app/constants/messages';

export interface ServiceItem {
  category: string;
  required: boolean;
  notes: string;
}

const ServicesSection: React.FC<{ services: ServiceItem[] }> = ({ services }) => {
  if (!services?.length) return null;
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
        Serviços Necessários
      </h2>
      <div
        style={{
          display: 'grid',
          gap: '16px',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        }}
      >
        {services.map((service, index) => (
          <div
            key={index}
            style={{
              padding: '16px',
              border: '1px solid #eee',
              borderRadius: '8px',
              background: service.required ? '#fff5f5' : '#f8f9fa',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '8px',
              }}
            >
              <span style={{ fontWeight: 500, textTransform: 'capitalize' }}>
                {translateServiceCategory(service.category)}
              </span>
              <span
                style={{
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                  background: service.required ? '#e74c3c' : '#95a5a6',
                  color: 'white',
                }}
              >
                {service.required ? 'Necessário' : 'Opcional'}
              </span>
            </div>
            {service.notes && (
              <div style={{ fontSize: '0.875rem', color: '#666', marginTop: '8px' }}>
                <strong>Observações:</strong> {service.notes}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ServicesSection;

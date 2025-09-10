'use client';

import React from 'react';
import { PartnerService } from '@/modules/partner/hooks/usePartnerServices';
import ServiceNode from './ServiceNode';

interface CategoryNodeProps {
  categoryName: string;
  services: PartnerService[];
  isExpanded: boolean;
  onToggle: () => void;
  onServiceSelect?: (service: PartnerService) => void;
  selectedServiceId?: string;
}

const CategoryNode: React.FC<CategoryNodeProps> = ({
  categoryName,
  services,
  isExpanded,
  onToggle,
  onServiceSelect,
  selectedServiceId,
}) => {
  return (
    <div style={{ marginBottom: '8px' }}>
      {/* Cabeçalho da Categoria */}
      <button
        onClick={onToggle}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          padding: '8px 12px',
          background: 'none',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          textAlign: 'left',
          transition: 'background-color 0.2s',
        }}
        onMouseOver={e => {
          e.currentTarget.style.backgroundColor = '#f3f4f6';
        }}
        onMouseOut={e => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        <span
          style={{
            marginRight: '8px',
            fontSize: '12px',
            color: '#6b7280',
            transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s',
          }}
        >
          ▶
        </span>
        <span
          style={{
            fontSize: '14px',
            fontWeight: 500,
            color: '#374151',
            flex: 1,
          }}
        >
          {categoryName}
        </span>
        <span
          style={{
            fontSize: '12px',
            color: '#6b7280',
            backgroundColor: '#e5e7eb',
            padding: '2px 6px',
            borderRadius: '10px',
          }}
        >
          {services.length}
        </span>
      </button>

      {/* Lista de Serviços */}
      {isExpanded && (
        <div style={{ marginLeft: '20px', marginTop: '4px' }}>
          {services.map(service => (
            <ServiceNode
              key={service.id}
              service={service}
              onSelect={onServiceSelect}
              isSelected={selectedServiceId === service.id}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CategoryNode;

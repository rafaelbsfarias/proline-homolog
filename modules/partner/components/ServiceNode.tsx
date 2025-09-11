'use client';

import React from 'react';
import { PartnerService } from '@/modules/partner/hooks/usePartnerServices';

interface ServiceNodeProps {
  service: PartnerService;
  onSelect?: (service: PartnerService) => void;
  isSelected?: boolean;
}

const ServiceNode: React.FC<ServiceNodeProps> = ({ service, onSelect, isSelected = false }) => {
  const handleClick = () => {
    onSelect?.(service);
  };

  return (
    <button
      onClick={handleClick}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        padding: '6px 12px',
        background: isSelected ? '#002e4c' : 'transparent',
        border: 'none',
        borderRadius: '4px',
        cursor: onSelect ? 'pointer' : 'default',
        textAlign: 'left',
        transition: 'background-color 0.2s',
        marginBottom: '2px',
      }}
      onMouseOver={e => {
        if (!isSelected) {
          e.currentTarget.style.backgroundColor = '#f3f4f6';
        }
      }}
      onMouseOut={e => {
        if (!isSelected) {
          e.currentTarget.style.backgroundColor = 'transparent';
        }
      }}
    >
      <div
        style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: '#10b981',
          marginRight: '8px',
          flexShrink: 0,
        }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: '13px',
            fontWeight: 500,
            color: isSelected ? '#ffffff' : '#374151',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {service.name}
        </div>
        <div
          style={{
            fontSize: '11px',
            color: isSelected ? '#e5e7eb' : '#6b7280',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            marginTop: '2px',
          }}
        >
          R$ {service.price.toFixed(2).replace('.', ',')}
        </div>
      </div>
    </button>
  );
};

export default ServiceNode;

'use client';

import React from 'react';

interface ServiceCategoryFieldProps {
  label: string;
  checked: boolean;
  notes: string;
  onToggle: (checked: boolean) => void;
  onNotesChange: (notes: string) => void;
  disabled?: boolean;
}

const ServiceCategoryField: React.FC<ServiceCategoryFieldProps> = ({
  label,
  checked,
  notes,
  onToggle,
  onNotesChange,
  disabled = false,
}) => {
  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
        <input
          type="checkbox"
          checked={checked}
          onChange={e => onToggle(e.target.checked)}
          disabled={disabled}
          style={{ marginRight: '8px' }}
        />
        <label style={{ fontWeight: '500', color: '#374151' }}>{label}</label>
      </div>

      {checked && (
        <textarea
          value={notes}
          onChange={e => onNotesChange(e.target.value)}
          placeholder="Observações..."
          disabled={disabled}
          style={{
            width: '100%',
            minHeight: '60px',
            padding: '8px',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            fontSize: '14px',
            resize: 'vertical',
          }}
        />
      )}
    </div>
  );
};

export default ServiceCategoryField;

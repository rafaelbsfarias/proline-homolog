'use client';

import React from 'react';

interface PartnerServiceCategoryFieldProps {
  label: string;
  checked: boolean;
  notes: string;
  onToggle: (checked: boolean) => void;
  onNotesChange: (notes: string) => void;
  disabled?: boolean;
}

const PartnerServiceCategoryField: React.FC<PartnerServiceCategoryFieldProps> = ({
  label,
  checked,
  notes,
  onToggle,
  onNotesChange,
  disabled = false,
}) => {
  return (
    <div
      style={{
        border: '1px solid #e1e5e9',
        borderRadius: '8px',
        padding: '16px',
        backgroundColor: checked ? '#f0f9ff' : '#ffffff',
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
        <input
          type="checkbox"
          id={`service-${label.toLowerCase().replace(/\s+/g, '-')}`}
          checked={checked}
          onChange={e => onToggle(e.target.checked)}
          disabled={disabled}
          style={{
            marginRight: '8px',
            width: '16px',
            height: '16px',
            accentColor: '#10b981',
          }}
        />
        <label
          htmlFor={`service-${label.toLowerCase().replace(/\s+/g, '-')}`}
          style={{
            fontWeight: '600',
            color: '#374151',
            cursor: disabled ? 'not-allowed' : 'pointer',
            margin: 0,
          }}
        >
          {label}
        </label>
      </div>

      {checked && (
        <div style={{ marginTop: '8px' }}>
          <label
            style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#6b7280',
              marginBottom: '4px',
            }}
          >
            Observações:
          </label>
          <textarea
            value={notes}
            onChange={e => onNotesChange(e.target.value)}
            disabled={disabled}
            placeholder="Digite observações sobre este serviço..."
            style={{
              width: '100%',
              minHeight: '60px',
              padding: '8px',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              fontSize: '14px',
              resize: 'vertical',
              fontFamily: 'inherit',
            }}
          />
        </div>
      )}
    </div>
  );
};

export default PartnerServiceCategoryField;

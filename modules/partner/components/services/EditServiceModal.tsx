'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { PartnerService, UpdateServiceData } from '@/modules/partner/hooks/usePartnerServices';

interface EditServiceModalProps {
  service: PartnerService | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (serviceId: string, data: UpdateServiceData) => Promise<void>;
  loading: boolean;
}

const EditServiceModal: React.FC<EditServiceModalProps> = ({
  service,
  isOpen,
  onClose,
  onSave,
  loading,
}) => {
  const [formData, setFormData] = useState<UpdateServiceData>({
    name: '',
    description: '',
    price: 0,
    category: '',
  });

  // Atualizar form quando o serviço muda
  useEffect(() => {
    if (service) {
      setFormData({
        name: service.name,
        description: service.description,
        price: service.price,
        category: service.category || '',
      });
    }
  }, [service]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!service) return;

    try {
      await onSave(service.id, formData);
    } catch {
      // Erro já tratado no hook
    }
  };

  const handleInputChange = (field: keyof UpdateServiceData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // Não renderizar nada se não estiver aberto
  if (!isOpen) return null;

  const modalContent = (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(2px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 10,
          boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
          width: '100%',
          maxWidth: '500px',
          margin: '0 16px',
          maxHeight: '90vh',
          overflow: 'auto',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '24px',
            borderBottom: '1px solid #e5e7eb',
          }}
        >
          <h2
            style={{
              fontSize: '20px',
              fontWeight: 600,
              color: '#111827',
              margin: 0,
            }}
          >
            Editar Serviço
          </h2>
          <button
            onClick={onClose}
            style={{
              color: '#6b7280',
              fontSize: '24px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px',
              transition: 'color 0.2s',
            }}
            onMouseOver={e => (e.currentTarget.style.color = '#374151')}
            onMouseOut={e => (e.currentTarget.style.color = '#6b7280')}
            disabled={loading}
          >
            ✕
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}
        >
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: 500,
                color: '#374151',
                marginBottom: '4px',
              }}
            >
              Nome do Serviço
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={e => handleInputChange('name', e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s, box-shadow 0.2s',
                boxSizing: 'border-box',
              }}
              onFocus={e => {
                e.currentTarget.style.borderColor = '#002e4c';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0, 46, 76, 0.1)';
              }}
              onBlur={e => {
                e.currentTarget.style.borderColor = '#d1d5db';
                e.currentTarget.style.boxShadow = 'none';
              }}
              required
              disabled={loading}
            />
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: 500,
                color: '#374151',
                marginBottom: '4px',
              }}
            >
              Descrição
            </label>
            <textarea
              value={formData.description}
              onChange={e => handleInputChange('description', e.target.value)}
              rows={3}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s, box-shadow 0.2s',
                resize: 'none',
                boxSizing: 'border-box',
              }}
              onFocus={e => {
                e.currentTarget.style.borderColor = '#002e4c';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0, 46, 76, 0.1)';
              }}
              onBlur={e => {
                e.currentTarget.style.borderColor = '#d1d5db';
                e.currentTarget.style.boxShadow = 'none';
              }}
              required
              disabled={loading}
            />
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: 500,
                color: '#374151',
                marginBottom: '4px',
              }}
            >
              Preço (R$)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.price}
              onChange={e => handleInputChange('price', parseFloat(e.target.value) || 0)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s, box-shadow 0.2s',
                boxSizing: 'border-box',
              }}
              onFocus={e => {
                e.currentTarget.style.borderColor = '#002e4c';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0, 46, 76, 0.1)';
              }}
              onBlur={e => {
                e.currentTarget.style.borderColor = '#d1d5db';
                e.currentTarget.style.boxShadow = 'none';
              }}
              required
              disabled={loading}
            />
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: 500,
                color: '#374151',
                marginBottom: '4px',
              }}
            >
              Categoria
            </label>
            <input
              type="text"
              value={formData.category || ''}
              onChange={e => handleInputChange('category', e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s, box-shadow 0.2s',
                boxSizing: 'border-box',
              }}
              onFocus={e => {
                e.currentTarget.style.borderColor = '#002e4c';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0, 46, 76, 0.1)';
              }}
              onBlur={e => {
                e.currentTarget.style.borderColor = '#d1d5db';
                e.currentTarget.style.boxShadow = 'none';
              }}
              placeholder="Opcional"
              disabled={loading}
            />
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
              paddingTop: '16px',
              borderTop: '1px solid #e5e7eb',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 16px',
                fontSize: '14px',
                fontWeight: 500,
                color: '#374151',
                backgroundColor: '#f3f4f6',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
              }}
              onMouseOver={e => (e.currentTarget.style.backgroundColor = '#e5e7eb')}
              onMouseOut={e => (e.currentTarget.style.backgroundColor = '#f3f4f6')}
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              style={{
                padding: '8px 16px',
                fontSize: '14px',
                fontWeight: 600,
                color: '#ffffff',
                backgroundColor: '#002e4c',
                border: 'none',
                borderRadius: '6px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                transition: 'background-color 0.2s',
              }}
              onMouseOver={e => !loading && (e.currentTarget.style.backgroundColor = '#001a2e')}
              onMouseOut={e => !loading && (e.currentTarget.style.backgroundColor = '#002e4c')}
              disabled={loading}
            >
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default EditServiceModal;

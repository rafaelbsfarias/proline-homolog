'use client';
import React from 'react';

interface ConfirmDialogProps {
  open: boolean;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title = 'Tem certeza?',
  description = 'Essa ação não pode ser desfeita.',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  onConfirm,
  onCancel,
  loading = false,
}) => {
  if (!open) return null;
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(0,0,0,0.25)',
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
          padding: 32,
          minWidth: 340,
          maxWidth: '90vw',
          textAlign: 'center',
        }}
      >
        <h3 style={{ margin: 0, fontWeight: 700, fontSize: 20 }}>{title}</h3>
        <p style={{ color: '#444', margin: '18px 0 28px' }}>{description}</p>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '8px 28px',
              borderRadius: 6,
              border: 'none',
              background: '#f0f2f5',
              color: '#222',
              fontWeight: 500,
              fontSize: 16,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
            }}
            disabled={loading}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: '8px 28px',
              borderRadius: 6,
              border: 'none',
              background: 'linear-gradient(90deg, #d32f2f 100%, #d32f2f 100%)',
              color: '#fff',
              fontWeight: 600,
              fontSize: 16,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              boxShadow: '0 1px 4px rgba(244,67,54,0.08)',
            }}
            disabled={loading}
          >
            {loading ? 'Aguarde...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;

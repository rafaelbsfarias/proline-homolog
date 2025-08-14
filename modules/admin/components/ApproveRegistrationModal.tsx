'use client';
import React, { useState } from 'react';

interface ApproveRegistrationModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (fields: ApproveFields) => void;
  user: { id: string; full_name: string; email: string } | null;
}

export interface ApproveFields {
  parqueamento: string;
  quilometragem: string;
  percentualFipe: string;
  taxaOperacao: string;
}

const initialFields = {
  parqueamento: '',
  quilometragem: '',
  percentualFipe: '',
  taxaOperacao: '',
};

const ApproveRegistrationModal: React.FC<ApproveRegistrationModalProps> = ({
  open,
  onClose,
  onConfirm,
  user,
}) => {
  const [fields, setFields] = useState<ApproveFields>(initialFields);
  const [error, setError] = useState<string | null>(null);

  if (!open || !user) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFields({ ...fields, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !fields.parqueamento ||
      !fields.quilometragem ||
      !fields.percentualFipe ||
      !fields.taxaOperacao
    ) {
      setError('Preencha todos os campos obrigatórios.');
      return;
    }
    setError(null);
    onConfirm(fields);
    setFields(initialFields);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(0,0,0,0.25)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          background: '#fff',
          borderRadius: 10,
          padding: 32,
          minWidth: 340,
          boxShadow: '0 2px 16px rgba(0,0,0,0.13)',
        }}
      >
        <h3 style={{ marginTop: 0, marginBottom: 16 }}>Aprovar cadastro</h3>
        <div style={{ marginBottom: 12, fontWeight: 500 }}>
          {user.full_name} <br />
          <span style={{ fontWeight: 400, color: '#555' }}>{user.email}</span>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>
            Parqueamento*
            <br />
            <input
              name="parqueamento"
              value={fields.parqueamento}
              onChange={handleChange}
              style={{ width: '100%', padding: 8, borderRadius: 5, border: '1px solid #ccc' }}
            />
          </label>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>
            Quilometragem*
            <br />
            <input
              name="quilometragem"
              value={fields.quilometragem}
              onChange={handleChange}
              style={{ width: '100%', padding: 8, borderRadius: 5, border: '1px solid #ccc' }}
            />
          </label>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>
            Percentual da FIPE*
            <br />
            <input
              name="percentualFipe"
              value={fields.percentualFipe}
              onChange={handleChange}
              style={{ width: '100%', padding: 8, borderRadius: 5, border: '1px solid #ccc' }}
            />
          </label>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>
            Taxa de operação*
            <br />
            <input
              name="taxaOperacao"
              value={fields.taxaOperacao}
              onChange={handleChange}
              style={{ width: '100%', padding: 8, borderRadius: 5, border: '1px solid #ccc' }}
            />
          </label>
        </div>

        {error && <div style={{ color: 'red', marginBottom: 10 }}>{error}</div>}
        <div style={{ display: 'flex', gap: 12, marginTop: 18 }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#eee',
              color: '#333',
              border: 'none',
              borderRadius: 6,
              padding: '10px 20px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Cancelar
          </button>
          <button
            type="submit"
            style={{
              background: '#002e4c',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              padding: '10px 20px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Confirmar aprovação
          </button>
        </div>
      </form>
    </div>
  );
};

export default ApproveRegistrationModal;

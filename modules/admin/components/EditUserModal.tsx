'use client';
import React, { useState } from 'react';

interface EditUserModalProps {
  open: boolean;
  user: { id: string; full_name: string; email: string; role: string } | null;
  onClose: () => void;
  onSave: (fields: { full_name: string; role: string }) => void;
  loading?: boolean;
}

const EditUserModal: React.FC<EditUserModalProps> = ({ open, user, onClose, onSave, loading }) => {
  const [fields, setFields] = useState({
    full_name: user?.full_name || '',
    role: user?.role || '',
  });
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    setFields({ full_name: user?.full_name || '', role: user?.role || '' });
  }, [user]);

  if (!open || !user) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFields({ ...fields, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fields.full_name || !fields.role) {
      setError('Preencha todos os campos obrigatórios.');
      return;
    }
    setError(null);
    onSave(fields);
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
        zIndex: 9999,
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
          boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
          padding: 32,
          minWidth: 340,
          maxWidth: '90vw',
          textAlign: 'center',
        }}
      >
        <h3 style={{ margin: 0, fontWeight: 700, fontSize: 20 }}>Editar Usuário</h3>
        <div style={{ margin: '18px 0 12px' }}>
          <input
            name="full_name"
            value={fields.full_name}
            onChange={handleChange}
            placeholder="Nome completo"
            style={{
              width: '100%',
              padding: 8,
              marginBottom: 12,
              borderRadius: 6,
              border: '1px solid #ddd',
            }}
            disabled={loading}
          />
          <select
            name="role"
            value={fields.role}
            onChange={handleChange}
            style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ddd' }}
            disabled={loading}
          >
            <option value="">Selecione o perfil</option>
            <option value="admin">Administrador</option>
            <option value="partner">Parceiro</option>
            <option value="client">Cliente</option>
            <option value="user">Usuário</option>
            <option value="specialist">Especialista</option>
          </select>
        </div>
        {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 18 }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '8px 28px',
              borderRadius: 6,
              border: 'none',
              background: '#f0f2f5',
              color: '#222',
              fontWeight: 500,
              fontSize: 16,
            }}
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            style={{
              padding: '8px 28px',
              borderRadius: 6,
              border: 'none',
              background: '#002e4c',
              color: '#fff',
              fontWeight: 600,
              fontSize: 16,
            }}
            disabled={loading}
          >
            {loading ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditUserModal;

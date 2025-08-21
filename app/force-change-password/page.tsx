'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { getLogger } from '@/modules/logger';

const logger = getLogger('ForceChangePasswordPage');

export default function ForceChangePasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!password || !confirmPassword) {
      setError('Preencha e confirme a nova senha.');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/force-change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Erro ao redefinir senha.');
        logger.error('Erro ao atualizar senha', data.error);
      } else {
        setSuccess('Senha redefinida com sucesso! Você será redirecionado para o dashboard.');
        logger.info('Senha redefinida com sucesso.');
        setTimeout(() => router.push('/dashboard'), 2000);
      }
    } catch (err) {
      setError('Erro inesperado. Tente novamente.');
      logger.error('Erro no handleSubmit', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f5f5f5',
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          background: '#fff',
          padding: 32,
          borderRadius: 12,
          boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
          minWidth: 340,
        }}
      >
        <h2 style={{ marginBottom: 18 }}>Alterar Senha</h2>
        <p style={{ marginBottom: 18, color: '#666' }}>
          Por segurança, você precisa alterar sua senha temporária.
        </p>

        <div style={{ marginBottom: 16 }}>
          <label htmlFor="password">Nova senha</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #ccc' }}
            required
            disabled={loading}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label htmlFor="confirmPassword">Confirme a nova senha</label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #ccc' }}
            required
            disabled={loading}
          />
        </div>

        {error && <div style={{ color: '#e74c3c', marginBottom: 12 }}>{error}</div>}
        {success && <div style={{ color: '#2e7d32', marginBottom: 12 }}>{success}</div>}

        <button
          type="submit"
          style={{
            width: '100%',
            padding: 12,
            background: '#002e4c',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
          }}
          disabled={loading}
        >
          {loading ? 'Salvando...' : 'Redefinir Senha'}
        </button>
      </form>
    </div>
  );
}

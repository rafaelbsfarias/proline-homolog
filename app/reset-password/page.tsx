'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/modules/common/services/supabaseClient';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Estabelece sessão a partir dos tokens no hash da URL (fornecidos pelo Supabase após recovery)
  useEffect(() => {
    try {
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      if (accessToken && refreshToken) {
        supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
      }
    } catch {}
  }, []);

  async function handleSubmit(e: React.FormEvent) {
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
      // Opcional: garantir que a sessão está presente e obter o access_token
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      if (!accessToken) {
        setError('Sessão inválida. Abra o link do e-mail novamente.');
        setLoading(false);
        return;
      }

      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || 'Erro ao redefinir senha.');
      } else {
        setSuccess('Senha redefinida com sucesso! Faça login novamente.');
        setTimeout(() => router.push('/login'), 2000);
      }
    } catch (e) {
      setError('Erro ao redefinir senha. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

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
        <h2 style={{ marginBottom: 18 }}>Redefinir Senha</h2>
        <div style={{ marginBottom: 16 }}>
          <label htmlFor="password" style={{ display: 'block', marginBottom: 6 }}>
            Nova senha
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #ccc' }}
            required
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label htmlFor="confirmPassword" style={{ display: 'block', marginBottom: 6 }}>
            Confirme a nova senha
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #ccc' }}
            required
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
            fontWeight: 600,
          }}
          disabled={loading}
        >
          {loading ? 'Salvando...' : 'Redefinir Senha'}
        </button>
      </form>
    </div>
  );
}

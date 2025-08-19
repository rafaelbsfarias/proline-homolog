'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/modules/common/services/supabaseClient';
import { getLogger, ILogger } from '@/modules/logger';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Captura os tokens da URL
    const hash = window.location.hash;
    //logger.info("Hash da URL: " + hash);
    console.log('hash da URL: ', hash);
    const params = new URLSearchParams(hash.substring(1));
    console.log('params da URL: ', params);
    //logger.info("Parâmetros da URL: " + params);
    const accessToken = params.get('access_token');
    console.log('accessToken da URL: ', accessToken);
    //logger.info("Token de acesso: " + accessToken);

    if (accessToken) {
      // Estabelece a sessão com os tokens
      const { error: sessionError } = supabase.auth.setSession({
        access_token: accessToken,
      });

      if (sessionError) {
        setError(sessionError.message);
      }
    } else {
      setError('Tokens de autenticação não encontrados.');
    }
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
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        setError(error.message);
      } else {
        setSuccess('Senha redefinida com sucesso! Faça login novamente.');
        setTimeout(() => router.push('/login'), 2000);
      }
    } catch (err) {
      setError('Erro ao atualizar senha. Tente novamente.');
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

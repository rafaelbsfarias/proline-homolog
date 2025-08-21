'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { getLogger } from '@/modules/logger';

const logger = getLogger('ResetPasswordPage');

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [sessionValid, setSessionValid] = useState(false);
  const router = useRouter();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const emailFromUrl = searchParams.get('email');
    const hash = window.location.hash;

    logger.debug('URL searchParams:', window.location.search);
    logger.debug('URL hash:', hash);

    if (!emailFromUrl) {
      setError('Email não encontrado na URL.');
      logger.error('Email não encontrado na URL');
      return;
    }
    setEmail(emailFromUrl);
    logger.debug('Email extraído da URL:', emailFromUrl);

    if (hash.startsWith('#token=')) {
      const extractedToken = hash.replace('#token=', '');
      setToken(extractedToken);
      logger.debug('Token extraído do hash:', extractedToken);
      verifyRecoveryToken(emailFromUrl, extractedToken);
    } else {
      setError('Token não encontrado na URL.');
      logger.error('Token não encontrado na URL');
    }
  }, []);

  async function verifyRecoveryToken(email: string, token: string) {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'recovery',
      });

      if (error) {
        setError('Token inválido ou expirado. Por favor, solicite um novo link.');
        logger.error('Erro ao verificar token', error);
        setSessionValid(false);
        setLoading(false);
        return;
      }

      // Confirmar que a sessão temporária existe
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        setError('Sessão inválida. Por favor, solicite um novo link.');
        setSessionValid(false);
      } else {
        setSessionValid(true);
        logger.info('Token validado, sessão de recuperação criada.');
      }
    } catch (err) {
      setError('Erro inesperado ao validar token. Tente novamente.');
      logger.error('Erro inesperado em verifyRecoveryToken', err);
      setSessionValid(false);
    } finally {
      setLoading(false);
    }
  }

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

    if (!sessionValid) {
      setError('Sessão inválida ou token não verificado.');
      return;
    }

    setLoading(true);

    try {
      // Confirmar a sessão ativa antes de atualizar
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        setError('Sessão inválida. Por favor, solicite um novo link.');
        setSessionValid(false);
        setLoading(false);
        return;
      }

      // const { error } = await supabase.auth.updateUser({
      //   password,
      //   data: { must_change_password: true },
      // });

      const userId = session.user.id;
      const { data, error } = await supabase.auth.admin.updateUserById(userId, {
        password,
        app_metadata: { must_change_password: true },
      });

      if (error) {
        setError('Erro ao redefinir senha: ' + error.message);
        logger.error('Erro ao atualizar senha', error);
      } else {
        setSuccess('Senha redefinida com sucesso! Você já pode logar.');
        logger.info('Senha redefinida com sucesso.');
        setTimeout(() => router.push('/login'), 2000);
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
        <h2 style={{ marginBottom: 18 }}>Redefinir Senha</h2>

        <div style={{ marginBottom: 16 }}>
          <label htmlFor="password">Nova senha</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #ccc' }}
            required
            disabled={!sessionValid || loading}
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
            disabled={!sessionValid || loading}
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
          disabled={loading || !sessionValid}
        >
          {loading ? 'Salvando...' : 'Redefinir Senha'}
        </button>
      </form>
    </div>
  );
}

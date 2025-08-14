'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

/**
 * Página de callback para confirmação de email do Supabase
 * Processa o link de confirmação enviado por email
 */
export default function AuthCallbackPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const router = useRouter();

  // Criar cliente Supabase
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Obter os parâmetros da URL
        const urlParams = new URLSearchParams(window.location.search);
        const accessToken = urlParams.get('access_token');
        const refreshToken = urlParams.get('refresh_token');
        const type = urlParams.get('type');
        const next = urlParams.get('next');

        if ((type === 'signup' || type === 'invite') && accessToken && refreshToken) {
          // Definir a sessão com os tokens recebidos
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            setStatus('error');
            setMessage(`Erro na confirmação: ${error.message}`);
            return;
          }

          if (data.user) {
            // Atualizar metadados do usuário para indicar que o email foi confirmado
            const { error: updateError } = await supabase.auth.updateUser({
              data: {
                email_confirmed_at: new Date().toISOString(),
                email_confirmed_via_link: true,
              },
            });

            if (updateError) {
            }

            // Atualizar o profile para marcar email como confirmado
            const { error: profileError } = await supabase
              .from('profiles')
              .update({ email_confirmed: true })
              .eq('id', data.user.id);

            if (profileError) {
            }

            setStatus('success');

            if (type === 'invite') {
              setMessage('Convite aceito com sucesso! Redirecionando para definir sua senha...');
              // Redirecionar para reset de senha para novos parceiros
              setTimeout(() => {
                router.push(next || '/reset-password?type=new_user');
              }, 3000);
            } else {
              setMessage('Email confirmado com sucesso! Redirecionando...');
              // Redirecionar para o dashboard após 3 segundos
              setTimeout(() => {
                router.push('/dashboard?welcome=true&email_confirmed=true');
              }, 3000);
            }
          }
        } else {
          setStatus('error');
          setMessage('Link de confirmação inválido ou expirado.');
        }
      } catch (error) {
        setStatus('error');
        setMessage(
          `Erro inesperado: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
        );
      }
    };

    handleAuthCallback();
  }, [router, supabase]);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f8f9fa',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <div
        style={{
          background: '#fff',
          padding: '40px',
          borderRadius: '12px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.1)',
          textAlign: 'center',
          maxWidth: '400px',
          width: '90%',
        }}
      >
        {status === 'loading' && (
          <>
            <div
              style={{
                width: '40px',
                height: '40px',
                border: '3px solid #e3e3e3',
                borderTop: '3px solid #002e4c',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 20px',
              }}
            />
            <h2 style={{ margin: '0 0 10px', color: '#333' }}>Confirmando seu email...</h2>
            <p style={{ color: '#666', margin: 0 }}>
              Aguarde enquanto processamos sua confirmação.
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div
              style={{
                width: '60px',
                height: '60px',
                background: '#4caf50',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
                fontSize: '24px',
                color: '#fff',
              }}
            >
              ✓
            </div>
            <h2 style={{ margin: '0 0 10px', color: '#4caf50' }}>Email Confirmado!</h2>
            <p style={{ color: '#666', margin: 0 }}>{message}</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div
              style={{
                width: '60px',
                height: '60px',
                background: '#f44336',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
                fontSize: '24px',
                color: '#fff',
              }}
            >
              ✕
            </div>
            <h2 style={{ margin: '0 0 10px', color: '#f44336' }}>Erro na Confirmação</h2>
            <p style={{ color: '#666', margin: '0 0 20px' }}>{message}</p>
            <button
              onClick={() => router.push('/login')}
              style={{
                background: '#002e4c',
                color: '#fff',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '6px',
                fontSize: '16px',
                cursor: 'pointer',
                fontWeight: '500',
              }}
            >
              Ir para Login
            </button>
          </>
        )}

        <style jsx>{`
          @keyframes spin {
            0% {
              transform: rotate(0deg);
            }
            100% {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    </div>
  );
}

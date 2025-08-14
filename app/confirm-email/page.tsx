'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function ConfirmEmailContent() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  useEffect(() => {
    const confirmEmail = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Token de confirmação não encontrado.');
        return;
      }

      try {
        const response = await fetch('/api/confirm-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (response.ok) {
          setStatus('success');
          setMessage(data.message || 'Email confirmado com sucesso!');
        } else {
          setStatus('error');
          setMessage(data.error || 'Erro ao confirmar email.');
        }
      } catch {
        setStatus('error');
        setMessage('Erro de conexão. Tente novamente.');
      }
    };

    confirmEmail();
  }, [token]);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '20px',
      }}
    >
      <div
        style={{
          background: 'white',
          padding: '40px',
          borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
          textAlign: 'center',
          maxWidth: '500px',
          width: '100%',
        }}
      >
        {status === 'loading' && (
          <>
            <div
              style={{
                width: '50px',
                height: '50px',
                border: '4px solid #f3f3f3',
                borderTop: '4px solid #667eea',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 20px',
              }}
            />
            <h1 style={{ color: '#333', marginBottom: '10px' }}>Confirmando email...</h1>
            <p style={{ color: '#666' }}>
              Por favor, aguarde enquanto processamos sua confirmação.
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div
              style={{
                fontSize: '60px',
                marginBottom: '20px',
              }}
            >
              ✅
            </div>
            <h1 style={{ color: '#2e7d32', marginBottom: '20px' }}>Email Confirmado!</h1>
            <p style={{ color: '#666', marginBottom: '30px', lineHeight: '1.6' }}>{message}</p>
            <div style={{ marginTop: '30px' }}>
              <a
                href="/login"
                style={{
                  background: '#2e7d32',
                  color: 'white',
                  padding: '12px 30px',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  fontWeight: '600',
                  display: 'inline-block',
                  marginRight: '10px',
                }}
              >
                Fazer Login
              </a>
              <a
                href="/"
                style={{
                  background: '#f5f5f5',
                  color: '#333',
                  padding: '12px 30px',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  fontWeight: '600',
                  display: 'inline-block',
                }}
              >
                Página Inicial
              </a>
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <div
              style={{
                fontSize: '60px',
                marginBottom: '20px',
              }}
            >
              ❌
            </div>
            <h1 style={{ color: '#d32f2f', marginBottom: '20px' }}>Erro na Confirmação</h1>
            <p style={{ color: '#666', marginBottom: '30px', lineHeight: '1.6' }}>{message}</p>
            <div style={{ marginTop: '30px' }}>
              <a
                href="/login"
                style={{
                  background: '#667eea',
                  color: 'white',
                  padding: '12px 30px',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  fontWeight: '600',
                  display: 'inline-block',
                  marginRight: '10px',
                }}
              >
                Tentar Login
              </a>
              <a
                href="/forgot-password"
                style={{
                  background: '#f5f5f5',
                  color: '#333',
                  padding: '12px 30px',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  fontWeight: '600',
                  display: 'inline-block',
                }}
              >
                Recuperar Senha
              </a>
            </div>
          </>
        )}
      </div>

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
  );
}

export default function ConfirmEmailPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          }}
        >
          <div
            style={{
              background: 'white',
              padding: '40px',
              borderRadius: '12px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '50px',
                height: '50px',
                border: '4px solid #f3f3f3',
                borderTop: '4px solid #667eea',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 20px',
              }}
            />
            <p>Carregando...</p>
          </div>
        </div>
      }
    >
      <ConfirmEmailContent />
    </Suspense>
  );
}

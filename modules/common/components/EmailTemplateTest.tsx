import React, { useState } from 'react';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';

interface TestResult {
  method: string;
  template: string;
  email: string;
  success: boolean;
  timestamp: string;
  response: unknown;
  errorInfo?: {
    type: string;
    message: string;
    details: string;
    technical: unknown;
  };
}

interface EmailTestProps {
  onEmailSent?: (result: TestResult) => void;
}

const EmailTemplateTest: React.FC<EmailTestProps> = ({ onEmailSent }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const { authenticatedFetch } = useAuthenticatedFetch();

  // Helper para detectar e formatar erros específicos
  const formatError = (response: { data?: unknown; error?: string; ok: boolean }) => {
    const responseData = response.data as { details?: string } | undefined;
    if (responseData?.details?.includes?.('rate limit exceeded')) {
      return {
        type: 'rate_limit',
        message: '⏱️ Rate Limit Excedido',
        details:
          'O Supabase limita o envio de emails para o mesmo endereço. Aguarde 60 segundos ou use um email diferente.',
        technical: response.data,
      };
    }

    if (responseData?.details?.includes?.('Invalid email')) {
      return {
        type: 'invalid_email',
        message: '📧 Email Inválido',
        details: 'O formato do email fornecido é inválido.',
        technical: response.data,
      };
    }

    return {
      type: 'generic',
      message: '❌ Erro Genérico',
      details: response.error || 'Erro desconhecido',
      technical: response.data || response.error,
    };
  };

  const testInviteUser = async () => {
    if (!email) return;

    setLoading(true);
    try {
      const response = await authenticatedFetch('/api/admin/create-user', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Teste Template',
          email: email,
          role: 'especialista',
        }),
      });

      const newResult = {
        method: 'inviteUserByEmail',
        template: 'Invite User',
        email: email,
        success: response.ok,
        timestamp: new Date().toISOString(),
        response: response.data || response.error,
      };

      setResults(prev => [newResult, ...prev]);
      onEmailSent?.(newResult);
    } catch (error) {
      // Capturar e mostrar erro detalhado
      const errorResult = {
        method: 'inviteUserByEmail',
        template: 'Invite User',
        email: email,
        success: false,
        timestamp: new Date().toISOString(),
        response: {
          error: 'Erro na requisição',
          details: error instanceof Error ? error.message : 'Erro desconhecido',
        },
      };

      setResults(prev => [errorResult, ...prev]);
      onEmailSent?.(errorResult);
    } finally {
      setLoading(false);
    }
  };

  const testMagicLink = async () => {
    if (!email) return;

    setLoading(true);
    try {
      const response = await authenticatedFetch('/api/admin/send-magic-link', {
        method: 'POST',
        body: JSON.stringify({
          email: email,
        }),
      });

      const errorInfo = !response.ok ? formatError(response) : undefined;

      const newResult = {
        method: 'signInWithOtp',
        template: 'Magic Link',
        email: email,
        success: response.ok,
        timestamp: new Date().toISOString(),
        response: response.data || response.error,
        errorInfo: errorInfo,
      };

      setResults(prev => [newResult, ...prev]);
      onEmailSent?.(newResult);
    } catch (error) {
      // Capturar e mostrar erro detalhado
      const errorResult = {
        method: 'signInWithOtp',
        template: 'Magic Link',
        email: email,
        success: false,
        timestamp: new Date().toISOString(),
        response: {
          error: 'Erro na requisição',
          details: error instanceof Error ? error.message : 'Erro desconhecido',
        },
      };

      setResults(prev => [errorResult, ...prev]);
      onEmailSent?.(errorResult);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        backgroundColor: '#f8f9fa',
        padding: '20px',
        borderRadius: '8px',
        margin: '20px 0',
        border: '2px solid #0066cc',
      }}
    >
      <h3 style={{ color: '#0066cc', marginBottom: '15px' }}>🧪 Teste de Templates de Email</h3>

      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
          Email para teste:
        </label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="especialista@email.com"
          style={{
            width: '100%',
            padding: '8px',
            borderRadius: '4px',
            border: '1px solid #ddd',
            fontSize: '14px',
          }}
        />
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button
          onClick={testInviteUser}
          disabled={loading || !email}
          style={{
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            padding: '10px 15px',
            borderRadius: '4px',
            cursor: loading || !email ? 'not-allowed' : 'pointer',
            opacity: loading || !email ? 0.6 : 1,
          }}
        >
          📧 Testar Invite User
        </button>

        <button
          onClick={testMagicLink}
          disabled={loading || !email}
          style={{
            backgroundColor: '#002e4c',
            color: 'white',
            border: 'none',
            padding: '10px 15px',
            borderRadius: '4px',
            cursor: loading || !email ? 'not-allowed' : 'pointer',
            opacity: loading || !email ? 0.6 : 1,
          }}
        >
          ✨ Testar Magic Link
        </button>
      </div>

      {loading && <div style={{ color: '#666', fontStyle: 'italic' }}>Enviando email...</div>}

      {results.length > 0 && (
        <div>
          <h4>Resultados dos Testes:</h4>
          {results.map((result, index) => (
            <div
              key={index}
              style={{
                backgroundColor: result.success ? '#d4edda' : '#f8d7da',
                border: `1px solid ${result.success ? '#c3e6cb' : '#f5c6cb'}`,
                borderRadius: '4px',
                padding: '10px',
                marginBottom: '10px',
                fontSize: '12px',
              }}
            >
              <strong>{result.method}</strong> - Template: {result.template}
              <br />
              Email: {result.email} | Status: {result.success ? '✅ Sucesso' : '❌ Erro'}
              <br />
              <small>{new Date(result.timestamp).toLocaleString()}</small>
              {!result.success && result.errorInfo && (
                <div
                  style={{
                    marginTop: '8px',
                    padding: '10px',
                    backgroundColor: result.errorInfo.type === 'rate_limit' ? '#fff3cd' : '#f8d7da',
                    borderRadius: '4px',
                    fontSize: '12px',
                    border: `1px solid ${result.errorInfo.type === 'rate_limit' ? '#ffeaa7' : '#f5c6cb'}`,
                  }}
                >
                  <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                    {result.errorInfo.message}
                  </div>
                  <div style={{ marginBottom: '8px' }}>{result.errorInfo.details}</div>
                  <details style={{ fontSize: '10px' }}>
                    <summary style={{ cursor: 'pointer', marginBottom: '5px' }}>
                      Ver detalhes técnicos
                    </summary>
                    <pre
                      style={{
                        margin: '0',
                        backgroundColor: '#fff',
                        padding: '5px',
                        borderRadius: '3px',
                        overflow: 'auto',
                        maxHeight: '150px',
                      }}
                    >
                      {JSON.stringify(result.errorInfo.technical, null, 2)}
                    </pre>
                  </details>
                </div>
              )}
              {!result.success && !result.errorInfo && (
                <div
                  style={{
                    marginTop: '5px',
                    padding: '5px',
                    backgroundColor: '#f8d7da',
                    borderRadius: '3px',
                    fontSize: '11px',
                  }}
                >
                  <strong>Detalhes do erro:</strong>
                  <pre style={{ margin: '5px 0', fontSize: '10px' }}>
                    {JSON.stringify(result.response, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div
        style={{
          backgroundColor: '#fff3cd',
          border: '1px solid #ffeaa7',
          borderRadius: '4px',
          padding: '10px',
          fontSize: '12px',
          marginTop: '15px',
        }}
      >
        <strong>🎯 Objetivo:</strong> Comparar qual template é usado em cada método:
        <br />• <strong>Invite User</strong> → Usa template "Invite user" no Supabase
        <br />• <strong>Magic Link</strong> → Usa template "Magic Link" no Supabase
        <br />
        Configure os templates correspondentes no painel do Supabase para ver a diferença.
      </div>
    </div>
  );
};

export default EmailTemplateTest;

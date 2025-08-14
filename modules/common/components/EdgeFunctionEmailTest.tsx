import React, { useState } from 'react';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';

interface TestResult {
  method: string;
  approach: string;
  email: string;
  success: boolean;
  emailSent: boolean;
  timestamp: string;
  response: unknown;
  temporaryPassword?: string;
}

interface EdgeFunctionTestProps {
  onTestComplete?: (result: TestResult) => void;
}

const EdgeFunctionEmailTest: React.FC<EdgeFunctionTestProps> = ({ onTestComplete }) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const { authenticatedFetch } = useAuthenticatedFetch();

  const testSupabaseTemplates = async () => {
    if (!email || !name) return;

    setLoading(true);
    try {
      const response = await authenticatedFetch('/api/admin/create-user', {
        method: 'POST',
        body: JSON.stringify({
          name: name,
          email: email,
          role: 'especialista',
        }),
      });

      const result = response.data as { success?: boolean; emailSent?: boolean } | undefined;
      const testResult: TestResult = {
        method: 'inviteUserByEmail',
        approach: 'Supabase Templates',
        email: email,
        success: response.ok,
        emailSent: result?.emailSent || false,
        timestamp: new Date().toISOString(),
        response: response.data || response.error,
      };

      setResults(prev => [testResult, ...prev]);
      onTestComplete?.(testResult);
    } catch (error) {
      // Capturar e mostrar erro detalhado
      const errorResult: TestResult = {
        method: 'inviteUserByEmail',
        approach: 'Supabase Templates',
        email: email,
        success: false,
        emailSent: false,
        timestamp: new Date().toISOString(),
        response: {
          error: 'Erro na requisição',
          details: error instanceof Error ? error.message : 'Erro desconhecido',
        },
      };

      setResults(prev => [errorResult, ...prev]);
      onTestComplete?.(errorResult);
    } finally {
      setLoading(false);
    }
  };

  const testEdgeFunction = async () => {
    if (!email || !name) return;

    setLoading(true);
    try {
      const response = await authenticatedFetch('/api/admin/create-user-with-email', {
        method: 'POST',
        body: JSON.stringify({
          name: name,
          email: email,
          role: 'especialista',
        }),
      });

      const result = response.data as
        | { success?: boolean; emailSent?: boolean; temporaryPassword?: string }
        | undefined;
      const testResult: TestResult = {
        method: 'createUser + Edge Function',
        approach: 'Custom Email via Resend',
        email: email,
        success: response.ok,
        emailSent: result?.emailSent || false,
        timestamp: new Date().toISOString(),
        response: response.data || response.error,
        temporaryPassword: result?.temporaryPassword,
      };

      setResults(prev => [testResult, ...prev]);
      onTestComplete?.(testResult);
    } catch (error) {
      // Capturar e mostrar erro detalhado
      const errorResult: TestResult = {
        method: 'createUser + Edge Function',
        approach: 'Custom Email via Resend',
        email: email,
        success: false,
        emailSent: false,
        timestamp: new Date().toISOString(),
        response: {
          error: 'Erro na requisição',
          details: error instanceof Error ? error.message : 'Erro desconhecido',
        },
      };

      setResults(prev => [errorResult, ...prev]);
      onTestComplete?.(errorResult);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      data-cy="edge-function-test"
      style={{
        backgroundColor: '#e8f4f8',
        padding: '20px',
        borderRadius: '8px',
        margin: '20px 0',
        border: '2px solid #0066cc',
      }}
    >
      <h3 style={{ color: '#0066cc', marginBottom: '15px' }}>
        🚀 Teste: Supabase Templates vs Edge Functions
      </h3>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '15px',
          marginBottom: '15px',
        }}
      >
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Nome do usuário:
          </label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Nome do especialista"
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #ddd',
              fontSize: '14px',
            }}
          />
        </div>

        <div>
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
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button
          onClick={testSupabaseTemplates}
          disabled={loading || !email || !name}
          style={{
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            padding: '10px 15px',
            borderRadius: '4px',
            cursor: loading || !email || !name ? 'not-allowed' : 'pointer',
            opacity: loading || !email || !name ? 0.6 : 1,
            fontSize: '14px',
          }}
        >
          📧 Método Antigo (Templates)
        </button>

        <button
          onClick={testEdgeFunction}
          disabled={loading || !email || !name}
          style={{
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            padding: '10px 15px',
            borderRadius: '4px',
            cursor: loading || !email || !name ? 'not-allowed' : 'pointer',
            opacity: loading || !email || !name ? 0.6 : 1,
            fontSize: '14px',
          }}
        >
          🚀 Método Novo (Edge Function)
        </button>
      </div>

      {loading && (
        <div style={{ color: '#666', fontStyle: 'italic', marginBottom: '15px' }}>
          Processando...
        </div>
      )}

      {results.length > 0 && (
        <div>
          <h4>📊 Resultados dos Testes:</h4>
          {results.map((result, index) => (
            <div
              key={index}
              style={{
                backgroundColor: result.success
                  ? result.emailSent
                    ? '#d4edda'
                    : '#fff3cd'
                  : '#f8d7da',
                border: `1px solid ${
                  result.success ? (result.emailSent ? '#c3e6cb' : '#ffeaa7') : '#f5c6cb'
                }`,
                borderRadius: '4px',
                padding: '15px',
                marginBottom: '10px',
                fontSize: '13px',
              }}
            >
              <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                {result.method} - {result.approach}
              </div>

              <div style={{ marginBottom: '5px' }}>
                <strong>Email:</strong> {result.email} |<strong> Status:</strong>{' '}
                {result.success ? '✅ Criado' : '❌ Erro'} |<strong> Email:</strong>{' '}
                {result.emailSent ? '✅ Enviado' : '❌ Não enviado'}
              </div>

              {result.temporaryPassword && (
                <div
                  style={{
                    backgroundColor: '#f8f9fa',
                    padding: '8px',
                    borderRadius: '4px',
                    marginTop: '8px',
                    fontFamily: 'monospace',
                  }}
                >
                  <strong>Senha Temporária:</strong> {result.temporaryPassword}
                </div>
              )}

              <small style={{ color: '#666' }}>{new Date(result.timestamp).toLocaleString()}</small>

              {!result.success && (
                <div
                  style={{
                    marginTop: '10px',
                    padding: '8px',
                    backgroundColor: '#f8d7da',
                    borderRadius: '4px',
                    fontSize: '12px',
                  }}
                >
                  <strong>Detalhes do erro:</strong>
                  <pre
                    style={{
                      margin: '5px 0',
                      fontSize: '11px',
                      maxHeight: '200px',
                      overflow: 'auto',
                      backgroundColor: '#fff',
                      padding: '5px',
                      borderRadius: '3px',
                    }}
                  >
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
          backgroundColor: '#e7f3ff',
          border: '1px solid #b3d7ff',
          borderRadius: '4px',
          padding: '15px',
          fontSize: '13px',
          marginTop: '15px',
        }}
      >
        <strong>🎯 Comparação:</strong>
        <br />• <strong>Método Antigo:</strong> Usa inviteUserByEmail + templates do Supabase
        (limitado)
        <br />• <strong>Método Novo:</strong> Cria usuário + senha temporária + email customizado
        via Edge Function + Resend
        <br />
        <br />
        <strong>Vantagens do Método Novo:</strong>
        <br />
        ✅ Design completamente customizado
        <br />
        ✅ Inclui credenciais no email
        <br />
        ✅ Usuário pode logar imediatamente
        <br />
        ✅ Não depende dos templates do Supabase
        <br />✅ Mais rápido e confiável
      </div>
    </div>
  );
};

export default EdgeFunctionEmailTest;

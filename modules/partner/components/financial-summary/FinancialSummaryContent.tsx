'use client';

import React from 'react';
import { FinancialSummaryData } from '../../hooks/useFinancialSummary';

interface FinancialSummaryContentProps {
  data: FinancialSummaryData | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}

const FinancialSummaryContent: React.FC<FinancialSummaryContentProps> = ({
  data,
  loading,
  error,
  onRefresh,
}) => {
  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: 48,
              height: 48,
              border: '4px solid #e0e0e0',
              borderTop: '4px solid #3498db',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px',
            }}
          />
          <div style={{ fontSize: 14, color: '#666' }}>Carregando dados financeiros...</div>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          background: '#fee',
          border: '1px solid #fcc',
          borderRadius: 8,
          padding: 16,
          color: '#c33',
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: 8 }}>Erro ao carregar dados</div>
        <p style={{ fontSize: 14, marginBottom: 12 }}>{error}</p>
        <button
          onClick={onRefresh}
          style={{
            background: '#c33',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            padding: '8px 16px',
            cursor: 'pointer',
            fontSize: 13,
          }}
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div
        style={{
          background: '#fff',
          borderRadius: 8,
          padding: 32,
          textAlign: 'center',
          color: '#666',
        }}
      >
        <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
        <p style={{ fontSize: 16, marginBottom: 8 }}>Nenhum dado financeiro encontrado</p>
        <p style={{ fontSize: 13, color: '#999' }}>
          Tente selecionar outro período ou realizar novos orçamentos.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
      {/* Period Header */}
      <div
        style={{
          background: '#fff',
          borderRadius: 8,
          padding: 16,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
        }}
      >
        <div>
          <div style={{ fontSize: 14, color: '#666', marginBottom: 4 }}>📅 Período</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#333' }}>{data.period.label}</div>
          {data.period.start_date && data.period.end_date && (
            <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
              {new Date(data.period.start_date).toLocaleDateString('pt-BR')} até{' '}
              {new Date(data.period.end_date).toLocaleDateString('pt-BR')}
            </div>
          )}
        </div>
        <button
          onClick={onRefresh}
          style={{
            background: '#3498db',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            padding: '10px 16px',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <span>🔄</span>
          <span>Atualizar</span>
        </button>
      </div>

      {/* Main Metrics */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 16,
        }}
      >
        {/* Total Revenue */}
        <div
          style={{
            background: '#fff',
            borderRadius: 8,
            padding: 20,
            boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 12,
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 8,
                background: '#d4edda',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 24,
              }}
            >
              💰
            </div>
          </div>
          <div style={{ fontSize: 13, color: '#666', marginBottom: 4 }}>Receita Total</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#27ae60' }}>
            {data.metrics.total_revenue.formatted}
          </div>
          <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>Valor faturado no período</div>
        </div>

        {/* Total Quotes */}
        <div
          style={{
            background: '#fff',
            borderRadius: 8,
            padding: 20,
            boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 12,
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 8,
                background: '#d1ecf1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 24,
              }}
            >
              📋
            </div>
          </div>
          <div style={{ fontSize: 13, color: '#666', marginBottom: 4 }}>Total de Orçamentos</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#3498db' }}>
            {data.metrics.total_quotes}
          </div>
          <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>Orçamentos realizados</div>
        </div>

        {/* Average Quote Value */}
        <div
          style={{
            background: '#fff',
            borderRadius: 8,
            padding: 20,
            boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 12,
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 8,
                background: '#e7d5f7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 24,
              }}
            >
              📊
            </div>
          </div>
          <div style={{ fontSize: 13, color: '#666', marginBottom: 4 }}>Valor Médio</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#9b59b6' }}>
            {data.metrics.average_quote_value.formatted}
          </div>
          <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>Por orçamento</div>
        </div>
      </div>

      {/* Parts Info Card */}
      <div
        style={{
          background: '#fff',
          borderRadius: 8,
          padding: 20,
          boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
        }}
      >
        <div style={{ fontSize: 16, fontWeight: 600, color: '#333', marginBottom: 16 }}>
          🔧 Informações de Peças
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 16,
          }}
        >
          <div style={{ background: '#f8f9fa', borderRadius: 6, padding: 16 }}>
            <div style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>Peças Solicitadas</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#e67e22' }}>
              {data.metrics.parts.total_parts_requested}
            </div>
            <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>Quantidade total</div>
          </div>
          <div
            style={{
              background: 'linear-gradient(135deg, #fff5e6 0%, #ffe8cc 100%)',
              borderRadius: 6,
              padding: 16,
            }}
          >
            <div style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>Valor Total</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#e67e22' }}>
              {data.metrics.parts.total_parts_value.formatted}
            </div>
            <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>Custo com materiais</div>
          </div>
        </div>
      </div>

      {/* Projected Value Card */}
      <div
        style={{
          background: '#fff',
          borderRadius: 8,
          padding: 20,
          boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
        }}
      >
        <div style={{ fontSize: 16, fontWeight: 600, color: '#333', marginBottom: 16 }}>
          📈 Valor Projetado
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
          <div
            style={{
              background: '#fff9e6',
              border: '1px solid #ffe8a1',
              borderRadius: 6,
              padding: 16,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <div style={{ fontSize: 13, color: '#666', marginBottom: 4 }}>
                ⏱️ Aguardando Aprovação
              </div>
              <div style={{ fontSize: 11, color: '#999' }}>Orçamentos pendentes</div>
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#f39c12' }}>
              {data.metrics.projected_value.pending_approval.formatted}
            </div>
          </div>

          <div
            style={{
              background: '#e8f4fd',
              border: '1px solid #b8daff',
              borderRadius: 6,
              padding: 16,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <div style={{ fontSize: 13, color: '#666', marginBottom: 4 }}>⚡ Em Execução</div>
              <div style={{ fontSize: 11, color: '#999' }}>Serviços em andamento</div>
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#3498db' }}>
              {data.metrics.projected_value.in_execution.formatted}
            </div>
          </div>

          <div
            style={{
              background: 'linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%)',
              border: '2px solid #28a745',
              borderRadius: 6,
              padding: 16,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#155724', marginBottom: 4 }}>
                💹 Total Projetado
              </div>
              <div style={{ fontSize: 11, color: '#28a745' }}>Receita potencial</div>
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#28a745' }}>
              {data.metrics.projected_value.total_projected.formatted}
            </div>
          </div>
        </div>
      </div>

      {/* Info Footer */}
      <div
        style={{
          background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
          border: '1px solid #90caf9',
          borderRadius: 8,
          padding: 16,
          display: 'flex',
          gap: 12,
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 8,
            background: '#2196f3',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
            flexShrink: 0,
          }}
        >
          ℹ️
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#1565c0', marginBottom: 4 }}>
            Informações importantes
          </div>
          <div style={{ fontSize: 12, color: '#1976d2', lineHeight: 1.5 }}>
            Os dados apresentados refletem orçamentos confirmados, pendentes de aprovação e em
            execução. Os valores projetados são estimativas baseadas no status atual dos orçamentos.
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(FinancialSummaryContent);

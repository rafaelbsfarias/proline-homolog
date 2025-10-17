'use client';

import React, { useState, useMemo } from 'react';
import Header from '@/modules/admin/components/Header';
import FinancialSummaryContent from '@/modules/partner/components/financial-summary/FinancialSummaryContent';
import { useFinancialSummary } from '@/modules/partner/hooks/useFinancialSummary';

type PeriodOption =
  | 'current_month'
  | 'last_month'
  | 'last_3_months'
  | 'last_6_months'
  | 'last_year'
  | 'custom';

const FinancialSummaryPage = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodOption>('current_month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const period = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (selectedPeriod) {
      case 'current_month': {
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        return {
          start_date: start.toISOString().split('T')[0],
          end_date: end.toISOString().split('T')[0],
        };
      }
      case 'last_month': {
        const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const end = new Date(now.getFullYear(), now.getMonth(), 0);
        return {
          start_date: start.toISOString().split('T')[0],
          end_date: end.toISOString().split('T')[0],
        };
      }
      case 'last_3_months': {
        const start = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        return {
          start_date: start.toISOString().split('T')[0],
          end_date: today.toISOString().split('T')[0],
        };
      }
      case 'last_6_months': {
        const start = new Date(now.getFullYear(), now.getMonth() - 6, 1);
        return {
          start_date: start.toISOString().split('T')[0],
          end_date: today.toISOString().split('T')[0],
        };
      }
      case 'last_year': {
        const start = new Date(now.getFullYear() - 1, now.getMonth(), 1);
        return {
          start_date: start.toISOString().split('T')[0],
          end_date: today.toISOString().split('T')[0],
        };
      }
      case 'custom': {
        if (customStartDate && customEndDate) {
          return {
            start_date: customStartDate,
            end_date: customEndDate,
          };
        }
        return {};
      }
      default:
        return {};
    }
  }, [selectedPeriod, customStartDate, customEndDate]);

  const { data, loading, error, refetch } = useFinancialSummary(period);

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <Header />
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 24px' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: 8, color: '#333' }}>
            Resumo Financeiro
          </h1>
          <p style={{ color: '#666', fontSize: '0.875rem' }}>
            Acompanhe suas métricas financeiras, orçamentos e valores projetados.
          </p>
        </div>

        {/* Period Selector */}
        <div
          style={{
            background: '#fff',
            borderRadius: 8,
            padding: 20,
            marginBottom: 16,
            border: '1px solid #e5e7eb',
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 600, color: '#333', marginBottom: 12 }}>
            Período de análise
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: 8,
              marginBottom: selectedPeriod === 'custom' ? 16 : 0,
            }}
          >
            <button
              onClick={() => setSelectedPeriod('current_month')}
              style={{
                padding: '10px 16px',
                borderRadius: 6,
                border: '1px solid #e5e7eb',
                background: selectedPeriod === 'current_month' ? '#3498db' : '#fff',
                color: selectedPeriod === 'current_month' ? '#fff' : '#333',
                fontSize: 13,
                fontWeight: selectedPeriod === 'current_month' ? 600 : 400,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              Mês Atual
            </button>
            <button
              onClick={() => setSelectedPeriod('last_month')}
              style={{
                padding: '10px 16px',
                borderRadius: 6,
                border: '1px solid #e5e7eb',
                background: selectedPeriod === 'last_month' ? '#3498db' : '#fff',
                color: selectedPeriod === 'last_month' ? '#fff' : '#333',
                fontSize: 13,
                fontWeight: selectedPeriod === 'last_month' ? 600 : 400,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              Mês Anterior
            </button>
            <button
              onClick={() => setSelectedPeriod('last_3_months')}
              style={{
                padding: '10px 16px',
                borderRadius: 6,
                border: '1px solid #e5e7eb',
                background: selectedPeriod === 'last_3_months' ? '#3498db' : '#fff',
                color: selectedPeriod === 'last_3_months' ? '#fff' : '#333',
                fontSize: 13,
                fontWeight: selectedPeriod === 'last_3_months' ? 600 : 400,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              Últimos 3 Meses
            </button>
            <button
              onClick={() => setSelectedPeriod('last_6_months')}
              style={{
                padding: '10px 16px',
                borderRadius: 6,
                border: '1px solid #e5e7eb',
                background: selectedPeriod === 'last_6_months' ? '#3498db' : '#fff',
                color: selectedPeriod === 'last_6_months' ? '#fff' : '#333',
                fontSize: 13,
                fontWeight: selectedPeriod === 'last_6_months' ? 600 : 400,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              Últimos 6 Meses
            </button>
            <button
              onClick={() => setSelectedPeriod('last_year')}
              style={{
                padding: '10px 16px',
                borderRadius: 6,
                border: '1px solid #e5e7eb',
                background: selectedPeriod === 'last_year' ? '#3498db' : '#fff',
                color: selectedPeriod === 'last_year' ? '#fff' : '#333',
                fontSize: 13,
                fontWeight: selectedPeriod === 'last_year' ? 600 : 400,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              Último Ano
            </button>
            <button
              onClick={() => setSelectedPeriod('custom')}
              style={{
                padding: '10px 16px',
                borderRadius: 6,
                border: '1px solid #e5e7eb',
                background: selectedPeriod === 'custom' ? '#3498db' : '#fff',
                color: selectedPeriod === 'custom' ? '#fff' : '#333',
                fontSize: 13,
                fontWeight: selectedPeriod === 'custom' ? 600 : 400,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              Personalizado
            </button>
          </div>

          {/* Custom Date Range */}
          {selectedPeriod === 'custom' && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 12,
                paddingTop: 16,
                borderTop: '1px solid #e5e7eb',
                marginTop: 16,
              }}
            >
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 12,
                    color: '#666',
                    marginBottom: 6,
                    fontWeight: 500,
                  }}
                >
                  Data Inicial
                </label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={e => setCustomStartDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 6,
                    border: '1px solid #e5e7eb',
                    fontSize: 13,
                    color: '#333',
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 12,
                    color: '#666',
                    marginBottom: 6,
                    fontWeight: 500,
                  }}
                >
                  Data Final
                </label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={e => setCustomEndDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 6,
                    border: '1px solid #e5e7eb',
                    fontSize: 13,
                    color: '#333',
                  }}
                />
              </div>
            </div>
          )}
        </div>

        <FinancialSummaryContent data={data} loading={loading} error={error} onRefresh={refetch} />
      </main>
    </div>
  );
};

export default FinancialSummaryPage;

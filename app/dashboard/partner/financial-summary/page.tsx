'use client';

import React, { useState } from 'react';
import Header from '@/modules/admin/components/Header';
import FinancialSummaryContent from '@/modules/partner/components/financial-summary/FinancialSummaryContent';
import { useFinancialSummary } from '@/modules/partner/hooks/useFinancialSummary';

const FinancialSummaryPage = () => {
  const [period] = useState<{
    start_date?: string;
    end_date?: string;
  }>({});

  const { data, loading, error, refetch } = useFinancialSummary(period);

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <Header />
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 24px' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: 8, color: '#333' }}>
            💰 Resumo Financeiro
          </h1>
          <p style={{ color: '#666', fontSize: '0.875rem' }}>
            Acompanhe suas métricas financeiras, orçamentos e valores projetados.
          </p>
        </div>

        <FinancialSummaryContent data={data} loading={loading} error={error} onRefresh={refetch} />
      </main>
    </div>
  );
};

export default FinancialSummaryPage;

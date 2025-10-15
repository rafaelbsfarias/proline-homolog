'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Header from '@/modules/admin/components/Header';
import Link from 'next/link';
import { supabase } from '@/modules/common/services/supabaseClient';

type Totals = {
  collections_total: number;
  parking_total_today: number;
  approved_budgets_total: number;
  purchased_parts_total: number;
};

function formatBRL(v: number) {
  return (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function FinancialOverviewPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totals, setTotals] = useState<Totals | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const resp = await fetch('/api/admin/financial-overview', {
          headers: {
            'Content-Type': 'application/json',
            ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
          },
        });
        const data = await resp.json();
        if (!mounted) return;
        if (!resp.ok) {
          setError(data?.error || 'Erro ao carregar resumo financeiro');
          setTotals(null);
        } else {
          setTotals(data as Totals);
        }
      } catch {
        if (!mounted) return;
        setError('Erro ao carregar resumo financeiro');
        setTotals(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const grandTotal = useMemo(() => {
    if (!totals) return 0;
    return (
      (totals.collections_total || 0) +
      (totals.parking_total_today || 0) +
      (totals.approved_budgets_total || 0) +
      (totals.purchased_parts_total || 0)
    );
  }, [totals]);
  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <Header />
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 20px' }}>
        <Link
          href="/dashboard"
          style={{
            display: 'inline-block',
            marginBottom: '16px',
            color: '#3498db',
            textDecoration: 'none',
            fontSize: '0.875rem',
          }}
        >
          ← Voltar
        </Link>

        <h1 style={{ fontSize: '1.25rem', marginBottom: 16 }}>Resumo Financeiro Geral</h1>
        {loading ? (
          <div
            style={{
              background: '#fff',
              borderRadius: 8,
              border: '1px solid #e5e7eb',
              padding: 16,
            }}
          >
            Carregando...
          </div>
        ) : error ? (
          <div style={{ background: '#fee2e2', color: '#991b1b', padding: 16, borderRadius: 8 }}>
            {error}
          </div>
        ) : (
          totals && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: 12,
              }}
            >
              <div
                style={{
                  background: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: 8,
                  padding: 16,
                }}
              >
                <div style={{ color: '#666', fontSize: 12 }}>Coletas (aprovadas)</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0d9488' }}>
                  {formatBRL(totals.collections_total)}
                </div>
              </div>
              <div
                style={{
                  background: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: 8,
                  padding: 16,
                }}
              >
                <div style={{ color: '#666', fontSize: 12 }}>Parqueamento (dia)</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#7c3aed' }}>
                  {formatBRL(totals.parking_total_today)}
                </div>
              </div>
              <div
                style={{
                  background: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: 8,
                  padding: 16,
                }}
              >
                <div style={{ color: '#666', fontSize: 12 }}>Orçamentos aprovados</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#2563eb' }}>
                  {formatBRL(totals.approved_budgets_total)}
                </div>
              </div>
              <div
                style={{
                  background: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: 8,
                  padding: 16,
                }}
              >
                <div style={{ color: '#666', fontSize: 12 }}>Peças compradas</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#dc2626' }}>
                  {formatBRL(totals.purchased_parts_total)}
                </div>
              </div>
              <div
                style={{
                  background: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: 8,
                  padding: 16,
                }}
              >
                <div style={{ color: '#666', fontSize: 12 }}>Total consolidado</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#111827' }}>
                  {formatBRL(grandTotal)}
                </div>
              </div>
            </div>
          )
        )}
      </main>
    </div>
  );
}

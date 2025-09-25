'use client';

import React, { useEffect, useState } from 'react';
import Header from '@/modules/admin/components/Header';
import { supabase } from '@/modules/common/services/supabaseClient';
import { Loading } from '@/modules/common/components/Loading/Loading';

type PartnerSummary = {
  id: string;
  company_name: string;
  services_count: number;
  pending_budgets: number;
  executing_budgets: number;
  approval_budgets: number;
  is_active?: boolean;
};

export default function PartnerOverviewPage({
  searchParams,
}: {
  searchParams: { partnerId?: string };
}) {
  const partnerId = searchParams?.partnerId || '';
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [partner, setPartner] = useState<PartnerSummary | null>(null);

  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        if (!partnerId) {
          setError('Parâmetro partnerId ausente');
          setPartner(null);
          return;
        }
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const resp = await fetch(`/api/admin/partners/${partnerId}/overview`, {
          headers: {
            'Content-Type': 'application/json',
            ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
          },
        });
        const data = await resp.json();
        if (!mounted) return;
        if (!resp.ok) {
          setError(data?.error || 'Erro ao carregar parceiro');
          setPartner(null);
          return;
        }
        setPartner(data.partner as PartnerSummary);
      } catch (e) {
        if (!mounted) return;
        setError('Erro de rede ao carregar parceiro');
        setPartner(null);
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    };
    fetchData();
    return () => {
      mounted = false;
    };
  }, [partnerId]);

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <Header />
      {loading ? (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '70vh',
          }}
        >
          <Loading />
        </div>
      ) : (
        <main style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 20px' }}>
          <div style={{ marginBottom: 16 }}>
            <a href="/dashboard" style={{ color: '#072e4c', textDecoration: 'none' }}>
              &larr; Voltar
            </a>
          </div>
          {error ? (
            <div style={{ background: '#fff', borderRadius: 10, padding: 20, color: '#b91c1c' }}>
              {error}
            </div>
          ) : partner ? (
            <div style={{ display: 'grid', gap: 16 }}>
              <div
                style={{
                  background: '#fff',
                  borderRadius: 10,
                  padding: 20,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                }}
              >
                <h1 style={{ margin: 0, fontSize: '1.5rem', color: '#072e4c' }}>
                  {partner.company_name}
                </h1>
                <div style={{ marginTop: 8, color: '#555' }}>Parceiro ID: {partner.id}</div>
                <div style={{ marginTop: 4, color: partner.is_active ? '#16a34a' : '#9ca3af' }}>
                  {partner.is_active ? 'Ativo' : 'Inativo'}
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: 16,
                }}
              >
                <div
                  style={{
                    background: '#fff',
                    borderRadius: 10,
                    padding: 20,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  }}
                >
                  <div style={{ color: '#666', marginBottom: 6 }}>Serviços Cadastrados</div>
                  <div style={{ fontSize: '2rem', fontWeight: 700 }}>{partner.services_count}</div>
                </div>
                <div
                  style={{
                    background: '#fff',
                    borderRadius: 10,
                    padding: 20,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  }}
                >
                  <div style={{ color: '#666', marginBottom: 6 }}>Orçamentos Pendentes</div>
                  <div style={{ fontSize: '2rem', fontWeight: 700, color: '#f59e0b' }}>
                    {partner.pending_budgets}
                  </div>
                </div>
                <div
                  style={{
                    background: '#fff',
                    borderRadius: 10,
                    padding: 20,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  }}
                >
                  <div style={{ color: '#666', marginBottom: 6 }}>Em Execução</div>
                  <div style={{ fontSize: '2rem', fontWeight: 700, color: '#10b981' }}>
                    {partner.executing_budgets}
                  </div>
                </div>
                <div
                  style={{
                    background: '#fff',
                    borderRadius: 10,
                    padding: 20,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  }}
                >
                  <div style={{ color: '#666', marginBottom: 6 }}>Para Aprovação</div>
                  <div style={{ fontSize: '2rem', fontWeight: 700, color: '#ef4444' }}>
                    {partner.approval_budgets}
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </main>
      )}
    </div>
  );
}

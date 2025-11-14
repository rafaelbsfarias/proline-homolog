'use client';
import React, { useEffect, useState } from 'react';
import { supabase } from '@/modules/common/services/supabaseClient';

type FinancialItemType =
  | 'vehicle_collection'
  | 'executed_budget'
  | 'material_purchase'
  | 'parking_fee';

type VehicleFinancialItem = {
  id: string;
  type: FinancialItemType;
  description: string;
  status: 'finished' | 'in_progress' | 'pending';
  amount: number;
};

type VehicleFinancials = {
  vehicleId: string;
  plate: string;
  brand?: string;
  model?: string;
  items: VehicleFinancialItem[];
  total: number;
  status: 'finished' | 'in_progress' | 'pending';
};

type GeneralFees = {
  operation_fee: number;
  total: number;
};

type FinancialOverviewResponse = {
  general_fees: GeneralFees;
  vehicles: VehicleFinancials[];
  summary: {
    total_to_pay: number;
    total_future: number;
    grand_total: number;
  };
};

type Props = {
  clientId?: string;
};

function formatCurrencyBRL(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function typeLabel(type: FinancialItemType) {
  switch (type) {
    case 'vehicle_collection':
      return 'Coleta de Veículo';
    case 'executed_budget':
      return 'Orçamento Executado';
    case 'material_purchase':
      return 'Materiais Comprados';
    case 'parking_fee':
      return 'Parqueamento';
    default:
      return 'Item';
  }
}

function statusLabel(status: 'finished' | 'in_progress' | 'pending') {
  switch (status) {
    case 'finished':
      return 'Concluído';
    case 'in_progress':
      return 'Em execução';
    case 'pending':
      return 'Pendente';
    default:
      return status;
  }
}

export default function FinancialOverview({ clientId }: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<FinancialOverviewResponse | null>(null);

  useEffect(() => {
    if (!clientId) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        const response = await fetch(`/api/client/${clientId}/financial-overview`, {
          headers: {
            'Content-Type': 'application/json',
            ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
          },
        });

        if (!response.ok) {
          throw new Error('Erro ao buscar dados financeiros');
        }

        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [clientId]);

  if (loading) {
    return (
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 20px 24px' }}>
        <div style={{ textAlign: 'center', color: '#666' }}>Carregando...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 20px 24px' }}>
        <div style={{ color: '#dc2626', background: '#fee2e2', padding: 16, borderRadius: 8 }}>
          {error}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 20px 24px' }}>
        <div style={{ color: '#666' }}>Nenhum dado disponível</div>
      </div>
    );
  }

  const { general_fees, vehicles, summary } = data;
  const finishedVehicles = vehicles.filter(v => v.status === 'finished');
  const futureVehicles = vehicles.filter(v => v.status !== 'finished');

  const cardStyle: React.CSSProperties = {
    background: '#fff',
    borderRadius: 8,
    boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
    padding: 16,
  };

  const sectionTitle: React.CSSProperties = { fontWeight: 600, color: '#333', marginBottom: 8 };
  const itemRow: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0',
    borderBottom: '1px solid #eee',
  };

  const vehicleCardStyle: React.CSSProperties = {
    ...cardStyle,
    marginTop: 16,
  };

  const vehicleHeaderStyle: React.CSSProperties = {
    fontWeight: 600,
    color: '#072e4c',
    fontSize: '1.1rem',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottom: '2px solid #e0e0e0',
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 20px 24px' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#072e4c', marginBottom: 12 }}>
        Resumo Financeiro do Cliente
      </h1>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
        }}
      >
        <div style={cardStyle}>
          <div style={{ color: '#666', fontSize: 12 }}>Total a pagar</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#e67e22' }}>
            {formatCurrencyBRL(summary.total_to_pay)}
          </div>
        </div>
        <div style={cardStyle}>
          <div style={{ color: '#666', fontSize: 12 }}>Pagamentos futuros</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#002E4C' }}>
            {formatCurrencyBRL(summary.total_future)}
          </div>
        </div>
        <div style={cardStyle}>
          <div style={{ color: '#666', fontSize: 12 }}>Total geral</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#27ae60' }}>
            {formatCurrencyBRL(summary.grand_total)}
          </div>
        </div>
      </div>

      {/* Taxas Gerais */}
      {general_fees.operation_fee > 0 && (
        <div style={vehicleCardStyle}>
          <div style={sectionTitle}>Taxas Gerais</div>
          <div style={itemRow}>
            <div>
              <div style={{ fontWeight: 600, color: '#333' }}>Taxa de Operação</div>
              <div style={{ color: '#555', fontSize: 13 }}>Taxa aplicada ao cliente</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 700 }}>{formatCurrencyBRL(general_fees.operation_fee)}</div>
              <div style={{ color: '#27ae60', fontSize: 12 }}>Concluído</div>
            </div>
          </div>
        </div>
      )}

      {/* Veículos - Serviços Concluídos */}
      {finishedVehicles.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#072e4c', marginBottom: 8 }}>
            Veículos - A Pagar
          </h2>
          {finishedVehicles.map(vehicle => (
            <div key={vehicle.vehicleId} style={vehicleCardStyle}>
              <div style={vehicleHeaderStyle}>
                Placa: {vehicle.plate}
                {vehicle.brand && vehicle.model && (
                  <span
                    style={{ fontWeight: 400, fontSize: '0.9rem', marginLeft: 8, color: '#666' }}
                  >
                    ({vehicle.brand} {vehicle.model})
                  </span>
                )}
                <span style={{ float: 'right', color: '#e67e22' }}>
                  {formatCurrencyBRL(vehicle.total)}
                </span>
              </div>
              {vehicle.items.map(item => (
                <div key={item.id} style={itemRow}>
                  <div>
                    <div style={{ fontWeight: 600, color: '#333' }}>{typeLabel(item.type)}</div>
                    <div style={{ color: '#555', fontSize: 13 }}>{item.description}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700 }}>{formatCurrencyBRL(item.amount)}</div>
                    <div style={{ color: '#27ae60', fontSize: 12 }}>{statusLabel(item.status)}</div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Veículos - Serviços Futuros */}
      {futureVehicles.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#072e4c', marginBottom: 8 }}>
            Veículos - Pagamentos Futuros
          </h2>
          {futureVehicles.map(vehicle => (
            <div key={vehicle.vehicleId} style={vehicleCardStyle}>
              <div style={vehicleHeaderStyle}>
                Placa: {vehicle.plate}
                {vehicle.brand && vehicle.model && (
                  <span
                    style={{ fontWeight: 400, fontSize: '0.9rem', marginLeft: 8, color: '#666' }}
                  >
                    ({vehicle.brand} {vehicle.model})
                  </span>
                )}
                <span style={{ float: 'right', color: '#002E4C' }}>
                  {formatCurrencyBRL(vehicle.total)}
                </span>
              </div>
              {vehicle.items.map(item => (
                <div key={item.id} style={itemRow}>
                  <div>
                    <div style={{ fontWeight: 600, color: '#333' }}>{typeLabel(item.type)}</div>
                    <div style={{ color: '#555', fontSize: 13 }}>{item.description}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700 }}>{formatCurrencyBRL(item.amount)}</div>
                    <div style={{ color: '#666', fontSize: 12 }}>{statusLabel(item.status)}</div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Mensagem se não houver veículos */}
      {vehicles.length === 0 && general_fees.operation_fee === 0 && (
        <div style={{ marginTop: 24, ...cardStyle }}>
          <div style={{ color: '#777', textAlign: 'center', padding: 16 }}>
            Nenhum dado financeiro disponível no momento.
          </div>
        </div>
      )}
    </div>
  );
}

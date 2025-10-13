'use client';
import React, { useMemo } from 'react';

type FinancialItemType =
  | 'vehicle_collection'
  | 'executed_budget'
  | 'material_purchase'
  | 'operation_fee'
  | 'parking_fee';
type ServiceStatus = 'finished' | 'in_progress';

type FinancialItem = {
  id: string;
  type: FinancialItemType;
  description: string;
  vehiclePlate?: string;
  serviceStatus: ServiceStatus;
  dueDate?: string; // ISO date
  amount: number; // cents or BRL? We'll use BRL number for mock simplicity
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
    case 'operation_fee':
      return 'Taxa de Operação';
    case 'parking_fee':
      return 'Parqueamento';
    default:
      return 'Item';
  }
}

type MockVehicle = {
  plate: string;
  inPatioAtacado: boolean;
  enteredAt?: string; // ISO date quando entrou no pátio
};

type MockClientPricing = {
  taxaOperacao: number; // valor por veículo
  parqueamentoDiaria: number; // valor por dia por veículo no pátio_atacado
};

function getMockClientPricing(clientId?: string): MockClientPricing {
  // Valores estáticos com leve variação determinística por clientId
  const base: MockClientPricing = { taxaOperacao: 35, parqueamentoDiaria: 12.5 };
  if (!clientId) return base;
  const last = clientId.at(-1);
  if (last && /[0-9]/.test(last)) {
    const n = Number(last);
    return {
      taxaOperacao: base.taxaOperacao + (n % 3) * 5,
      parqueamentoDiaria: base.parqueamentoDiaria + (n % 4) * 2,
    };
  }
  if (clientId.endsWith('a')) return { taxaOperacao: 40, parqueamentoDiaria: 15 };
  return base;
}

function getMockVehiclesForClient(clientId?: string): MockVehicle[] {
  // Lista pequena e determinística de veículos "cadastrados" do cliente
  const base: MockVehicle[] = [
    { plate: 'ABC1D23', inPatioAtacado: false },
    { plate: 'EFG4H56', inPatioAtacado: true, enteredAt: daysAgoISO(3) },
    { plate: 'IJK7L89', inPatioAtacado: true, enteredAt: daysAgoISO(1) },
  ];
  if (!clientId) return base;
  // Varia a quantidade levemente por clientId
  if (clientId.length % 2 === 0) {
    return [...base, { plate: 'MNO0P12', inPatioAtacado: false }];
  }
  return base;
}

function daysAgoISO(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

// Mock simples e determinístico, incluindo taxas de operação e parqueamento
function getMockItems(clientId?: string): FinancialItem[] {
  const pricing = getMockClientPricing(clientId);
  const vehicles = getMockVehiclesForClient(clientId);
  const totalVehicles = vehicles.length; // "veículos cadastrados"

  // Taxa de operação: taxa por veículo x quantidade de veículos cadastrados
  const totalTaxaOperacao = pricing.taxaOperacao * totalVehicles;

  // Parqueamento: diária x total de dias de todos veículos no pátio_atacado
  const vehiclesInPatio = vehicles.filter(v => v.inPatioAtacado && v.enteredAt);
  const totalDiasPatio = vehiclesInPatio.reduce((sum, v) => {
    if (!v.enteredAt) return sum;
    const entered = new Date(v.enteredAt).getTime();
    const now = Date.now();
    const diffDays = Math.max(1, Math.ceil((now - entered) / (1000 * 60 * 60 * 24)));
    return sum + diffDays;
  }, 0);
  const totalParqueamento = pricing.parqueamentoDiaria * totalDiasPatio;

  const base: FinancialItem[] = [
    {
      id: 'fee-op',
      type: 'operation_fee',
      description: `Taxa por veículo (${totalVehicles} x ${formatCurrencyBRL(pricing.taxaOperacao)})`,
      serviceStatus: 'finished',
      amount: totalTaxaOperacao,
    },
    {
      id: 'fee-park',
      type: 'parking_fee',
      description: `Parqueamento (${vehiclesInPatio.length} veículo(s), ${totalDiasPatio} dia(s) no pátio)`,
      serviceStatus: 'finished',
      amount: totalParqueamento,
    },
    {
      id: 'it-1',
      type: 'vehicle_collection',
      description: 'Coleta do veículo em domicílio',
      vehiclePlate: 'ABC1D23',
      serviceStatus: 'finished',
      dueDate: new Date().toISOString(),
      amount: 120.0,
    },
    {
      id: 'it-2',
      type: 'executed_budget',
      description: 'Reparo de alternador',
      vehiclePlate: 'ABC1D23',
      serviceStatus: 'finished',
      dueDate: new Date().toISOString(),
      amount: 850.0,
    },
    {
      id: 'it-3',
      type: 'material_purchase',
      description: 'Compra de correia e rolamentos',
      vehiclePlate: 'ABC1D23',
      serviceStatus: 'finished',
      dueDate: new Date().toISOString(),
      amount: 230.5,
    },
    {
      id: 'it-4',
      type: 'executed_budget',
      description: 'Instalação de acessórios elétricos',
      vehiclePlate: 'EFG4H56',
      serviceStatus: 'in_progress',
      dueDate: undefined,
      amount: 640.0,
    },
    {
      id: 'it-5',
      type: 'material_purchase',
      description: 'Kit de iluminação (projeção)',
      vehiclePlate: 'EFG4H56',
      serviceStatus: 'in_progress',
      dueDate: undefined,
      amount: 180.0,
    },
  ];
  // Variação leve por clientId só para não parecer 100% fixo
  if (clientId && clientId.endsWith('a')) {
    return base.map(i => (i.id === 'it-2' ? { ...i, amount: i.amount + 50 } : i));
  }
  return base;
}

export default function FinancialOverview({ clientId }: Props) {
  const items = useMemo(() => getMockItems(clientId), [clientId]);

  const toPay = items.filter(i => i.serviceStatus === 'finished');
  const future = items.filter(i => i.serviceStatus === 'in_progress');

  const totalToPay = toPay.reduce((sum, i) => sum + i.amount, 0);
  const totalFuture = future.reduce((sum, i) => sum + i.amount, 0);
  const grandTotal = totalToPay + totalFuture;

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
            {formatCurrencyBRL(totalToPay)}
          </div>
        </div>
        <div style={cardStyle}>
          <div style={{ color: '#666', fontSize: 12 }}>Pagamentos futuros</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#3498db' }}>
            {formatCurrencyBRL(totalFuture)}
          </div>
        </div>
        <div style={cardStyle}>
          <div style={{ color: '#666', fontSize: 12 }}>Total geral</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#27ae60' }}>
            {formatCurrencyBRL(grandTotal)}
          </div>
        </div>
      </div>

      {/* A Pagar */}
      <div style={{ marginTop: 24, ...cardStyle }}>
        <div style={sectionTitle}>A pagar</div>
        {toPay.length === 0 ? (
          <div style={{ color: '#777' }}>Nenhum valor a pagar no momento.</div>
        ) : (
          <div>
            {toPay.map(item => (
              <div key={item.id} style={itemRow}>
                <div>
                  <div style={{ fontWeight: 600, color: '#333' }}>{typeLabel(item.type)}</div>
                  <div style={{ color: '#555', fontSize: 13 }}>{item.description}</div>
                  {item.vehiclePlate && (
                    <div style={{ color: '#888', fontSize: 12 }}>Placa: {item.vehiclePlate}</div>
                  )}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700 }}>{formatCurrencyBRL(item.amount)}</div>
                  {item.dueDate && (
                    <div style={{ color: '#999', fontSize: 12 }}>
                      Venc.: {new Date(item.dueDate).toLocaleDateString('pt-BR')}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagamentos futuros */}
      <div style={{ marginTop: 16, ...cardStyle }}>
        <div style={sectionTitle}>Pagamentos futuros</div>
        {future.length === 0 ? (
          <div style={{ color: '#777' }}>Nenhum pagamento futuro previsto.</div>
        ) : (
          <div>
            {future.map(item => (
              <div key={item.id} style={itemRow}>
                <div>
                  <div style={{ fontWeight: 600, color: '#333' }}>{typeLabel(item.type)}</div>
                  <div style={{ color: '#555', fontSize: 13 }}>{item.description}</div>
                  {item.vehiclePlate && (
                    <div style={{ color: '#888', fontSize: 12 }}>Placa: {item.vehiclePlate}</div>
                  )}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700 }}>{formatCurrencyBRL(item.amount)}</div>
                  <div style={{ color: '#999', fontSize: 12 }}>Em execução</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

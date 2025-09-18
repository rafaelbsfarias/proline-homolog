'use client';

import React from 'react';
import { Budget, BudgetItem } from '@/modules/partner/hooks/useBudget';

interface BudgetSummaryProps {
  budget: Budget;
  onBudgetInfoChange: (
    name: string,
    vehiclePlate: string,
    vehicleModel: string,
    vehicleBrand: string,
    vehicleYear?: number
  ) => void;
  onQuantityChange: (serviceId: string, quantity: number) => void;
  onRemoveService: (serviceId: string) => void;
}

const BudgetSummary: React.FC<BudgetSummaryProps> = ({
  budget,
  onBudgetInfoChange,
  onQuantityChange,
  onRemoveService,
}) => {
  const handleBudgetNameChange = (name: string) => {
    onBudgetInfoChange(
      name,
      budget.vehiclePlate,
      budget.vehicleModel,
      budget.vehicleBrand,
      budget.vehicleYear
    );
  };

  return (
    <div
      style={{
        background: '#fff',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        position: 'sticky',
        top: '24px',
      }}
    >
      <h3
        style={{
          fontSize: '18px',
          fontWeight: '600',
          marginBottom: '24px',
          color: '#333',
        }}
      >
        Resumo do Orçamento
      </h3>

      {/* Informações do Orçamento */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ marginBottom: '16px' }}>
          <label
            style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: '#666',
              marginBottom: '4px',
            }}
          >
            Nome do Orçamento
          </label>
          <input
            type="text"
            value={budget.name}
            onChange={e => handleBudgetNameChange(e.target.value)}
            placeholder="Ex: Orçamento Lavagem Completa"
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '14px',
              outline: 'none',
              transition: 'border-color 0.2s',
            }}
            onFocus={e => (e.target.style.borderColor = '#007bff')}
            onBlur={e => (e.target.style.borderColor = '#ddd')}
          />
        </div>

        {/* Resumo do Veículo */}
        <div
          style={{
            background: '#f8f9fa',
            border: '1px solid #dee2e6',
            borderRadius: '8px',
            padding: '16px',
            marginTop: '16px',
          }}
        >
          <div
            style={{
              fontSize: '14px',
              fontWeight: '600',
              color: '#495057',
              marginBottom: '12px',
            }}
          >
            🚗 Informações do Veículo
          </div>

          {budget.vehiclePlate ||
          budget.vehicleModel ||
          budget.vehicleBrand ||
          budget.vehicleYear ? (
            <div style={{ fontSize: '14px', color: '#666' }}>
              {budget.vehiclePlate && (
                <div style={{ marginBottom: '8px' }}>
                  <strong>Placa:</strong>{' '}
                  <span
                    style={{
                      fontFamily: 'monospace',
                      background: '#e9ecef',
                      padding: '2px 6px',
                      borderRadius: '4px',
                    }}
                  >
                    {budget.vehiclePlate}
                  </span>
                </div>
              )}
              {budget.vehicleModel && (
                <div style={{ marginBottom: '8px' }}>
                  <strong>Modelo:</strong> {budget.vehicleModel}
                </div>
              )}
              {budget.vehicleBrand && (
                <div style={{ marginBottom: '8px' }}>
                  <strong>Marca:</strong> {budget.vehicleBrand}
                </div>
              )}
              {budget.vehicleYear && (
                <div style={{ marginBottom: '8px' }}>
                  <strong>Ano:</strong> {budget.vehicleYear}
                </div>
              )}
            </div>
          ) : (
            <div style={{ fontSize: '14px', color: '#999', fontStyle: 'italic' }}>
              Nenhum veículo selecionado
            </div>
          )}
        </div>
      </div>

      {/* Serviços Selecionados */}
      <div style={{ marginBottom: '24px' }}>
        <h4
          style={{
            fontSize: '16px',
            fontWeight: '600',
            color: '#666',
            marginBottom: '16px',
          }}
        >
          Serviços Selecionados ({budget.items.length})
        </h4>

        {budget.items.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '24px',
              color: '#999',
              background: '#f8f8f8',
              borderRadius: '8px',
              fontSize: '14px',
            }}
          >
            Nenhum serviço selecionado
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {budget.items.map((item: BudgetItem) => (
              <div
                key={item.service.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px',
                  background: '#f8f9ff',
                  border: '1px solid #e0e7ff',
                  borderRadius: '8px',
                }}
              >
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#333',
                      marginBottom: '4px',
                    }}
                  >
                    {item.service.name}
                  </div>
                  <div
                    style={{
                      fontSize: '12px',
                      color: '#666',
                      marginBottom: '8px',
                    }}
                  >
                    R$ {item.unitPrice.toFixed(2)} cada
                  </div>
                  <div
                    style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#28a745',
                    }}
                  >
                    Total: R$ {item.totalPrice.toFixed(2)}
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginLeft: '12px',
                  }}
                >
                  <button
                    onClick={() => onQuantityChange(item.service.id, item.quantity - 1)}
                    style={{
                      width: '24px',
                      height: '24px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      background: '#fff',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '14px',
                      color: '#666',
                    }}
                    disabled={item.quantity <= 1}
                  >
                    -
                  </button>

                  <span
                    style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#333',
                      minWidth: '24px',
                      textAlign: 'center',
                    }}
                  >
                    {item.quantity}
                  </span>

                  <button
                    onClick={() => onQuantityChange(item.service.id, item.quantity + 1)}
                    style={{
                      width: '24px',
                      height: '24px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      background: '#fff',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '14px',
                      color: '#666',
                    }}
                  >
                    +
                  </button>

                  <button
                    onClick={() => onRemoveService(item.service.id)}
                    style={{
                      width: '24px',
                      height: '24px',
                      border: 'none',
                      borderRadius: '4px',
                      background: '#dc3545',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      color: '#fff',
                      marginLeft: '8px',
                    }}
                    title="Remover serviço"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Total e Ações */}
      <div
        style={{
          borderTop: '1px solid #e0e0e0',
          paddingTop: '16px',
          marginBottom: '24px',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
          }}
        >
          <span
            style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#333',
            }}
          >
            Total:
          </span>
          <span
            style={{
              fontSize: '20px',
              fontWeight: '700',
              color: '#28a745',
            }}
          >
            R$ {budget.totalValue.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Informação sobre ações */}
      <div
        style={{
          background: '#f8f9fa',
          padding: '12px',
          borderRadius: '6px',
          fontSize: '12px',
          color: '#6c757d',
          textAlign: 'center',
        }}
      >
        Use os botões de ação no final da página para salvar ou limpar o orçamento
      </div>
    </div>
  );
};

export default BudgetSummary;

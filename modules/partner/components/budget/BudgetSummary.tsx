'use client';

import React from 'react';
import { BudgetItem } from '@/modules/partner/hooks/useBudget';

interface BudgetSummaryProps {
  budgetName: string;
  clientName: string;
  selectedServices: BudgetItem[];
  totalValue: number;
  onBudgetNameChange: (name: string) => void;
  onClientNameChange: (clientName: string) => void;
  onQuantityChange: (serviceId: string, quantity: number) => void;
  onRemoveService: (serviceId: string) => void;
  onSave: () => void;
  onClear: () => void;
}

const BudgetSummary: React.FC<BudgetSummaryProps> = ({
  budgetName,
  clientName,
  selectedServices,
  totalValue,
  onBudgetNameChange,
  onClientNameChange,
  onQuantityChange,
  onRemoveService,
  onSave,
  onClear,
}) => {
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
            value={budgetName}
            onChange={e => onBudgetNameChange(e.target.value)}
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
            Nome do Cliente
          </label>
          <input
            type="text"
            value={clientName}
            onChange={e => onClientNameChange(e.target.value)}
            placeholder="Ex: João Silva"
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
          Serviços Selecionados ({selectedServices.length})
        </h4>

        {selectedServices.length === 0 ? (
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
            {selectedServices.map(item => (
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
            R$ {totalValue.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Botões de Ação */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <button
          onClick={onSave}
          disabled={selectedServices.length === 0 || !budgetName.trim() || !clientName.trim()}
          style={{
            width: '100%',
            padding: '12px',
            background:
              selectedServices.length > 0 && budgetName.trim() && clientName.trim()
                ? '#28a745'
                : '#ccc',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '600',
            cursor:
              selectedServices.length > 0 && budgetName.trim() && clientName.trim()
                ? 'pointer'
                : 'not-allowed',
            transition: 'background-color 0.2s',
          }}
        >
          Salvar Orçamento
        </button>

        <button
          onClick={onClear}
          style={{
            width: '100%',
            padding: '12px',
            background: '#6c757d',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'background-color 0.2s',
          }}
          onMouseOver={e => ((e.target as HTMLElement).style.background = '#5a6268')}
          onMouseOut={e => ((e.target as HTMLElement).style.background = '#6c757d')}
        >
          Limpar Orçamento
        </button>
      </div>
    </div>
  );
};

export default BudgetSummary;

'use client';

import React from 'react';
import { PartnerService } from '@/modules/partner/hooks/usePartnerServices';
import { BudgetItem } from '@/modules/partner/hooks/useBudget';

interface BudgetServiceSelectorProps {
  services: PartnerService[];
  selectedServices: BudgetItem[];
  onServiceSelect: (service: PartnerService, selected: boolean) => void;
  loading: boolean;
  error: string | null;
}

const BudgetServiceSelector: React.FC<BudgetServiceSelectorProps> = ({
  services,
  selectedServices,
  onServiceSelect,
  loading,
  error,
}) => {
  const isServiceSelected = (serviceId: string) => {
    return selectedServices.some(item => item.service.id === serviceId);
  };

  const getServiceQuantity = (serviceId: string) => {
    const item = selectedServices.find(item => item.service.id === serviceId);
    return item?.quantity || 0;
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '48px' }}>
        <div>Carregando serviços...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: '48px',
          color: '#dc3545',
          background: '#f8d7da',
          border: '1px solid #f5c6cb',
          borderRadius: '8px',
        }}
      >
        <div>Erro ao carregar serviços: {error}</div>
      </div>
    );
  }

  // Agrupar serviços por categoria
  const servicesByCategory = services.reduce(
    (acc, service) => {
      const category = service.category || 'Outros';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(service);
      return acc;
    },
    {} as Record<string, PartnerService[]>
  );

  return (
    <div>
      <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '24px' }}>
        Selecionar Serviços
      </h2>

      {Object.entries(servicesByCategory).map(([category, categoryServices]) => (
        <div key={category} style={{ marginBottom: '32px' }}>
          <h3
            style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#666',
              marginBottom: '16px',
              borderBottom: '1px solid #e0e0e0',
              paddingBottom: '8px',
            }}
          >
            {category}
          </h3>

          <div style={{ display: 'grid', gap: '12px' }}>
            {categoryServices.map(service => {
              const selected = isServiceSelected(service.id);
              const quantity = getServiceQuantity(service.id);

              return (
                <div
                  key={service.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '16px',
                    border: `2px solid ${selected ? '#007bff' : '#e0e0e0'}`,
                    borderRadius: '8px',
                    background: selected ? '#f8f9ff' : '#fff',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onClick={() => onServiceSelect(service, !selected)}
                >
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={e => onServiceSelect(service, e.target.checked)}
                    style={{
                      width: '18px',
                      height: '18px',
                      marginRight: '16px',
                      cursor: 'pointer',
                    }}
                  />

                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        marginBottom: '4px',
                        color: selected ? '#007bff' : '#333',
                      }}
                    >
                      {service.name}
                    </div>
                    <div
                      style={{
                        fontSize: '14px',
                        color: '#666',
                        marginBottom: '8px',
                      }}
                    >
                      {service.description}
                    </div>
                    <div
                      style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        color: '#28a745',
                      }}
                    >
                      R$ {service.price.toFixed(2)}
                    </div>
                  </div>

                  {selected && quantity > 0 && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginLeft: '16px',
                      }}
                    >
                      <span style={{ fontSize: '14px', color: '#666' }}>Qtd:</span>
                      <span
                        style={{
                          fontSize: '16px',
                          fontWeight: '600',
                          color: '#007bff',
                        }}
                      >
                        {quantity}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {services.length === 0 && !loading && (
        <div
          style={{
            textAlign: 'center',
            padding: '48px',
            color: '#666',
            background: '#f8f8f8',
            borderRadius: '8px',
          }}
        >
          <div>Nenhum serviço cadastrado.</div>
          <div style={{ fontSize: '14px', marginTop: '8px' }}>
            Cadastre serviços em "Gerenciar Serviços" para poder criar orçamentos.
          </div>
        </div>
      )}
    </div>
  );
};

export default BudgetServiceSelector;

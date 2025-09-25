'use client';

import React from 'react';

interface InspectionDataProps {
  inspectionDate?: string;
  odometer?: number | string;
  fuelLevel?: string;
  observations?: string;
}

const InspectionData: React.FC<InspectionDataProps> = ({
  inspectionDate,
  odometer,
  fuelLevel,
  observations,
}) => {
  const getFuelLevelLabel = (level?: string): string => {
    switch (level) {
      case 'empty':
        return 'Vazio';
      case 'quarter':
        return '1/4';
      case 'half':
        return '1/2';
      case 'three_quarters':
        return '3/4';
      case 'full':
        return 'Cheio';
      default:
        return 'Não informado';
    }
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'Não informado';
    try {
      return new Date(dateString).toLocaleDateString('pt-BR');
    } catch {
      return 'Data inválida';
    }
  };

  const formatOdometer = (km?: number | string): string => {
    if (km === null || km === undefined || km === '') return 'Não informado';
    const numKm = typeof km === 'string' ? parseFloat(km) : km;
    return isNaN(numKm) || numKm === 0 ? 'Não informado' : `${numKm.toLocaleString('pt-BR')} km`;
  };

  return (
    <div
      style={{
        background: '#ffffff',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      }}
    >
      <div
        style={{
          marginBottom: '20px',
        }}
      >
        <h2
          style={{
            fontSize: '1.5rem',
            fontWeight: '600',
            color: '#111827',
            margin: 0,
          }}
        >
          Dados da Inspeção
        </h2>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px',
          marginBottom: '20px',
        }}
      >
        <div>
          <label
            style={{
              display: 'block',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '8px',
            }}
          >
            Data da Inspeção *
          </label>
          <div
            style={{
              padding: '12px',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '16px',
              color: '#374151',
            }}
          >
            {formatDate(inspectionDate)}
          </div>
        </div>

        <div>
          <label
            style={{
              display: 'block',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '8px',
            }}
          >
            Quilometragem Atual (km) *
          </label>
          <div
            style={{
              padding: '12px',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '16px',
              color: '#374151',
            }}
          >
            {formatOdometer(odometer)}
          </div>
        </div>

        <div>
          <label
            style={{
              display: 'block',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '8px',
            }}
          >
            Nível de Combustível
          </label>
          <div
            style={{
              padding: '12px',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '16px',
              color: '#374151',
            }}
          >
            {getFuelLevelLabel(fuelLevel)}
          </div>
        </div>
      </div>

      <div>
        <label
          style={{
            display: 'block',
            fontWeight: '600',
            color: '#374151',
            marginBottom: '8px',
          }}
        >
          Observações Gerais
        </label>
        <div
          style={{
            padding: '12px',
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            fontSize: '16px',
            color: '#374151',
            minHeight: '100px',
            whiteSpace: 'pre-wrap',
          }}
        >
          {observations || 'Nenhuma observação registrada.'}
        </div>
      </div>
    </div>
  );
};

export default InspectionData;

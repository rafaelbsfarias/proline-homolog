'use client';

import React from 'react';
import styles from './InspectionData.module.css';

interface InspectionDataProps {
  inspectionDate?: string;
  odometer?: number | string;
  fuelLevel?: string;
  observations?: string;
  partnerServiceNotes?: string;
}

const InspectionData: React.FC<InspectionDataProps> = ({
  inspectionDate,
  odometer,
  fuelLevel,
  observations,
  partnerServiceNotes,
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
    <div className={styles.inspectionDataCard}>
      <div className={styles.cardHeader}>
        <h2 className={styles.cardTitle}>Dados da Inspeção</h2>
      </div>

      <div className={styles.fieldsGrid}>
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Data da Inspeção *</label>
          <div className={styles.fieldValue}>{formatDate(inspectionDate)}</div>
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Quilometragem Atual (km) *</label>
          <div className={styles.fieldValue}>{formatOdometer(odometer)}</div>
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Nível de Combustível</label>
          <div className={styles.fieldValue}>{getFuelLevelLabel(fuelLevel)}</div>
        </div>
      </div>

      <div className={styles.observationsGrid}>
        <div className={styles.observationsGroup}>
          <label className={styles.fieldLabel}>Observações Gerais</label>
          <div className={styles.observationsValue}>
            {observations || 'Nenhuma observação registrada.'}
          </div>
        </div>

        <div className={styles.observationsGroup}>
          <label className={styles.fieldLabel}>Observações Específicas do Serviço</label>
          <div className={styles.observationsValue}>
            {partnerServiceNotes || 'Nenhuma observação específica registrada.'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InspectionData;

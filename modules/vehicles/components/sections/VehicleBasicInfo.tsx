import React from 'react';
import { SectionCard } from '../cards/SectionCard';
import { StatusBadge } from '../cards/StatusBadge';
import { VehicleDetails } from '../../types/VehicleDetailsTypes';
import { formatCurrency, formatDateBR, getStatusLabel } from '../../utils/formatters';
import { translateFuelLevel } from '@/app/constants/messages';
import styles from './VehicleBasicInfo.module.css';

interface VehicleBasicInfoProps {
  vehicle: VehicleDetails;
  onViewEvidences?: () => void;
  mediaCount?: number;
}

export const VehicleBasicInfo: React.FC<VehicleBasicInfoProps> = ({
  vehicle,
  onViewEvidences,
  mediaCount = 0,
}) => {
  const headerAction = mediaCount > 0 && onViewEvidences && (
    <button onClick={onViewEvidences} className={styles.evidenceButton}>
      Ver Evidências ({mediaCount})
    </button>
  );

  return (
    <SectionCard title="Informações Básicas" headerAction={headerAction}>
      <div className={styles.grid}>
        <InfoRow label="Placa" value={vehicle.plate} monospace />
        <InfoRow label="Marca" value={vehicle.brand} />
        <InfoRow label="Modelo" value={`${vehicle.model} (${vehicle.year})`} />
        <InfoRow label="Cor" value={vehicle.color || 'N/A'} />
        <InfoRow label="Status" value={<StatusBadge status={getStatusLabel(vehicle.status)} />} />
        <InfoRow label="Valor FIPE" value={formatCurrency(vehicle.fipe_value)} />
        <InfoRow label="KM Atual" value={vehicle.current_odometer?.toString() || 'N/A'} />
        <InfoRow label="Nível de Combustível" value={translateFuelLevel(vehicle.fuel_level)} />
        <InfoRow label="Cadastrado em" value={formatDateBR(vehicle.created_at)} />
        <InfoRow label="Previsão de Chegada" value={formatDateBR(vehicle.estimated_arrival_date)} />
      </div>
    </SectionCard>
  );
};

interface InfoRowProps {
  label: string;
  value: React.ReactNode;
  monospace?: boolean;
}

const InfoRow: React.FC<InfoRowProps> = ({ label, value, monospace = false }) => {
  return (
    <div className={styles.row}>
      <span className={styles.label}>{label}:</span>
      <span className={monospace ? styles.valueMonospace : styles.value}>{value}</span>
    </div>
  );
};

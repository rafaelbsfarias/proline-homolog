import { getAnomaliesByVehicle } from '../repositories/AnomaliesRepository';
import { mapAnomaliesWithUrls } from '../mappers/ChecklistMappers';
import type { Partner } from '../schemas';

export async function getAnomaliesChecklist(vehicleId: string, partner: Partner) {
  const anomalies = await getAnomaliesByVehicle(vehicleId);
  const mapped = await mapAnomaliesWithUrls(anomalies);
  return {
    type: 'anomalies' as const,
    checklist: {
      vehicle_id: vehicleId,
      partner: { id: partner.id, name: partner.name, type: partner.partner_type },
    },
    anomalies: mapped,
    stats: { totalAnomalies: mapped.length },
  };
}

export async function getAnomaliesChecklistDirect(vehicleId: string) {
  const anomalies = await getAnomaliesByVehicle(vehicleId);
  if (!anomalies || anomalies.length === 0) return null;
  const mapped = await mapAnomaliesWithUrls(anomalies);
  return {
    type: 'anomalies' as const,
    checklist: {
      vehicle_id: vehicleId,
      partner: { id: 'unknown', name: 'Parceiro', type: 'other' },
    },
    anomalies: mapped,
    stats: { totalAnomalies: mapped.length },
  };
}

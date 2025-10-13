import { AnomalyEvidence } from '../types';

export const hasValidAnomaly = (anomalies: AnomalyEvidence[]): boolean => {
  return anomalies.some(anomaly => anomaly.description.trim() !== '');
};

export const validatePartRequest = (partName: string, quantity: number): boolean => {
  return partName.trim().length > 0 && quantity > 0;
};

export const isAnomalyComplete = (anomaly: AnomalyEvidence): boolean => {
  return anomaly.description.trim().length > 0 && anomaly.photos.length > 0;
};

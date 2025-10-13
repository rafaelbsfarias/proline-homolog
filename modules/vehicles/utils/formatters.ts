import { VEHICLE_CONSTANTS } from '@/app/constants/messages';

export const formatCurrency = (value: number | undefined): string => {
  if (!value) return 'N/A';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const getStatusLabel = (status: string): string => {
  return (
    VEHICLE_CONSTANTS.VEHICLE_STATUS[status as keyof typeof VEHICLE_CONSTANTS.VEHICLE_STATUS] ||
    status
  );
};

export const formatDateBR = (date: string | undefined): string => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('pt-BR');
};

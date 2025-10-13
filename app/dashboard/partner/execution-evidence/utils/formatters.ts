export const formatDateTime = (dateString: string): string => {
  return new Date(dateString).toLocaleString('pt-BR');
};

export const formatVehicleInfo = (brand: string, model: string, plate: string): string => {
  return `${plate} - ${brand} ${model}`;
};

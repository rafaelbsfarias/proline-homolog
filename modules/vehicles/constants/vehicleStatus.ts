export const VehicleStatus = {
  AGUARDANDO_COLETA: 'AGUARDANDO COLETA',
  AGUARDANDO_CHEGADA: 'AGUARDANDO CHEGADA DO VEÍCULO',
  CHEGADA_CONFIRMADA: 'CHEGADA CONFIRMADA',
  EM_ANALISE: 'EM ANÁLISE',
  ANALISE_FINALIZADA: 'ANÁLISE FINALIZADA',
} as const;

export type VehicleStatus = (typeof VehicleStatus)[keyof typeof VehicleStatus];

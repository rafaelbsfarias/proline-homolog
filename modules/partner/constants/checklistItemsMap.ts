export type ChecklistItemKey =
  | 'clutch'
  | 'sparkPlugs'
  | 'belts'
  | 'engine'
  | 'radiator'
  | 'fluids'
  | 'frontShocks'
  | 'rearShocks'
  | 'suspension'
  | 'tires'
  | 'brakePads'
  | 'brakeDiscs'
  | 'steeringBox'
  | 'electricSteeringBox'
  | 'exhaust'
  | 'airConditioning'
  | 'airConditioningCompressor'
  | 'airConditioningCleaning'
  | 'electricalActuationGlass'
  | 'electricalActuationMirror'
  | 'electricalActuationSocket'
  | 'electricalActuationLock'
  | 'electricalActuationTrunk'
  | 'electricalActuationWiper'
  | 'electricalActuationKey'
  | 'electricalActuationAlarm'
  | 'electricalActuationInteriorLight'
  | 'dashboardPanel'
  | 'lights'
  | 'battery';

export const ITEM_METADATA: Record<ChecklistItemKey, { label: string; category: string }> = {
  // Motor e Transmissão
  clutch: { label: 'Embreagem', category: 'Motor e Transmissão' },
  sparkPlugs: { label: 'Velas de Ignição', category: 'Motor e Transmissão' },
  belts: { label: 'Correias', category: 'Motor e Transmissão' },
  engine: { label: 'Motor', category: 'Motor e Transmissão' },

  // Sistema de Arrefecimento / Fluidos
  radiator: { label: 'Radiador', category: 'Sistema de Arrefecimento' },
  fluids: { label: 'Fluidos', category: 'Sistema de Arrefecimento' },

  // Suspensão
  frontShocks: { label: 'Amortecedores Dianteiros', category: 'Suspensão' },
  rearShocks: { label: 'Amortecedores Traseiros', category: 'Suspensão' },
  suspension: { label: 'Sistema de Suspensão', category: 'Suspensão' },

  // Pneu/Freios
  tires: { label: 'Pneus', category: 'Pneu/Freios' },
  brakePads: { label: 'Pastilha de Freio', category: 'Pneu/Freios' },
  brakeDiscs: { label: 'Disco de Freio', category: 'Pneu/Freios' },

  // Direção / Escape
  steeringBox: { label: 'Caixa de Direção', category: 'Motor' },
  electricSteeringBox: { label: 'Caixa Direção Elétrica', category: 'Motor' },
  exhaust: { label: 'Sistema de Escape', category: 'Motor' },

  // Ar Condicionado
  airConditioning: { label: 'Ar Condicionado', category: 'Ar Condicionado' },
  airConditioningCompressor: {
    label: 'Compressor Ar Condicionado',
    category: 'Ar Condicionado',
  },
  airConditioningCleaning: {
    label: 'Limpeza Ar Condicionado',
    category: 'Ar Condicionado',
  },

  // Elétrica
  electricalActuationGlass: { label: 'Vidro', category: 'Elétrica' },
  electricalActuationMirror: { label: 'Retrovisor', category: 'Elétrica' },
  electricalActuationSocket: { label: 'Tomada 12V', category: 'Elétrica' },
  electricalActuationLock: { label: 'Trava', category: 'Elétrica' },
  electricalActuationTrunk: { label: 'Porta-malas', category: 'Elétrica' },
  electricalActuationWiper: { label: 'Limpador', category: 'Elétrica' },
  electricalActuationKey: { label: 'Chave', category: 'Elétrica' },
  electricalActuationAlarm: { label: 'Alarme', category: 'Elétrica' },
  electricalActuationInteriorLight: { label: 'Luz Interna', category: 'Elétrica' },
  dashboardPanel: { label: 'Painel', category: 'Elétrica' },
  lights: { label: 'Lâmpadas', category: 'Elétrica' },

  // Bateria
  battery: { label: 'Bateria', category: 'Bateria' },
};

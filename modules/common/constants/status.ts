// Centralized status constants to avoid drift across routes
export const STATUS = {
  AGUARDANDO_APROVACAO: 'AGUARDANDO APROVAÇÃO DA COLETA',
  SOLICITACAO_MUDANCA_DATA: 'SOLICITAÇÃO DE MUDANÇA DE DATA',
  APROVACAO_NOVA_DATA: 'APROVAÇÃO NOVA DATA',
  AGUARDANDO_COLETA: 'AGUARDANDO COLETA',
  PONTO_COLETA_SELECIONADO: 'PONTO DE COLETA SELECIONADO',
  APPROVED: 'approved',
  REQUESTED: 'requested',
} as const;

export type StatusValue = (typeof STATUS)[keyof typeof STATUS];

/**
 * Constantes de cores para a Timeline do veículo
 */

export const TIMELINE_COLORS = {
  BLUE: '#3498db', // Azul - Eventos iniciais, em andamento
  ORANGE: '#f39c12', // Laranja - Orçamentos, previsões
  RED: '#e74c3c', // Vermelho - Alertas, reprovações
  GREEN: '#27ae60', // Verde - Finalizações, aprovações
  PURPLE: '#9b59b6', // Roxo - Padrão, outros eventos
} as const;

export const STATUS_COLOR_MAP: Record<string, string> = {
  // Eventos do veículo
  cadastrado: TIMELINE_COLORS.BLUE,
  previsao_chegada: TIMELINE_COLORS.ORANGE,
  analise_iniciada: TIMELINE_COLORS.RED,
  analise_finalizada: TIMELINE_COLORS.GREEN,

  // Orçamentos
  orcamento_iniciado: TIMELINE_COLORS.ORANGE,
  orcamento_finalizado: TIMELINE_COLORS.ORANGE,
  orcamento_aprovado: TIMELINE_COLORS.GREEN,
  orcamento_reprovado: TIMELINE_COLORS.RED,

  // Serviços
  servico_iniciado: TIMELINE_COLORS.BLUE,
  servico_em_andamento: TIMELINE_COLORS.BLUE,
  servico_finalizado: TIMELINE_COLORS.GREEN,
  servico_cancelado: TIMELINE_COLORS.RED,
} as const;

/**
 * Retorna a cor apropriada para um status baseado em palavras-chave
 */
export function getStatusColor(statusLabel: string): string {
  const normalizedLabel = statusLabel.toLowerCase().trim();

  // Verifica mapeamento direto
  if (STATUS_COLOR_MAP[normalizedLabel]) {
    return STATUS_COLOR_MAP[normalizedLabel];
  }

  // Verifica palavras-chave
  if (normalizedLabel.includes('orçament')) return TIMELINE_COLORS.ORANGE;
  if (normalizedLabel.includes('finalizada') || normalizedLabel.includes('aprovado')) {
    return TIMELINE_COLORS.GREEN;
  }
  if (normalizedLabel.includes('iniciad') || normalizedLabel.includes('andamento')) {
    return TIMELINE_COLORS.BLUE;
  }
  if (normalizedLabel.includes('reprovado') || normalizedLabel.includes('cancelado')) {
    return TIMELINE_COLORS.RED;
  }

  return TIMELINE_COLORS.PURPLE;
}

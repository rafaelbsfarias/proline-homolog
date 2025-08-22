export function sanitizeStatus(status?: string): string {
  return (status ?? '').toString().trim().toLowerCase().replace(/\s+/g, '-');
}

export function statusLabel(status?: string): string {
  if (!status) return '—';
  const raw = String(status).trim();
  const s = raw.toUpperCase();
  if (s === 'AGUARDANDO DEFINIÇÃO DE COLETA') return 'Aguardando definição de coleta';
  if (s === 'PONTO DE COLETA SELECIONADO') return 'Ponto de coleta selecionado';
  if (s === 'AGUARDANDO APROVAÇÃO DA COLETA') return 'Aguardando aprovação da coleta';
  if (s === 'AGUARDANDO COLETA') return 'Aguardando coleta';
  if (s === 'AGUARDANDO CHEGADA DO CLIENTE') return 'Aguardando chegada do cliente';
  if (s === 'AGUARDANDO CHEGADA DO VEÍCULO') return 'Aguardando chegada do veículo';
  if (s === 'CHEGADA CONFIRMADA') return 'Chegada confirmada';
  if (s === 'EM ANÁLISE') return 'Em análise';
  if (s === 'ANÁLISE FINALIZADA' || s === 'ANALISE FINALIZADA') return 'Análise finalizada';
  return raw;
}

export function statusOrder(statusRaw: string): number {
  const s = String(statusRaw || '').toUpperCase().trim();
  if (s === 'AGUARDANDO DEFINIÇÃO DE COLETA') return 1;
  if (s === 'AGUARDANDO CHEGADA DO CLIENTE') return 2;
  if (s === 'AGUARDANDO CHEGADA DO VEÍCULO') return 2;
  if (s === 'PONTO DE COLETA SELECIONADO') return 2;
  if (s === 'AGUARDANDO APROVAÇÃO DA COLETA') return 2;
  if (s === 'AGUARDANDO COLETA') return 2;
  if (s === 'CHEGADA CONFIRMADA') return 3;
  if (s === 'EM ANÁLISE') return 4;
  if (s === 'ANÁLISE FINALIZADA' || s === 'ANALISE FINALIZADA') return 5;
  return 99;
}

export function canClientModify(status?: string): boolean {
  const s = String(status || '').toUpperCase();
  return (
    s === 'AGUARDANDO DEFINIÇÃO DE COLETA' ||
    s === 'PONTO DE COLETA SELECIONADO' ||
    s === 'AGUARDANDO COLETA' ||
    s === 'AGUARDANDO CHEGADA DO VEÍCULO' ||
    s === 'AGUARDANDO CHEGADA DO CLIENTE'
  );
}

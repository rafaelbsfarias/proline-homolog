import { capitalizeTitle } from '@/modules/vehicles/timeline/utils';

export function sanitizeStatus(status?: string): string {
  return (status ?? '').toString().trim().toLowerCase().replace(/\s+/g, '-');
}

export function statusLabel(status?: string): string {
  if (!status) return '—';
  const raw = String(status).trim();

  // Usar capitalização automática para padronizar todos os status
  return capitalizeTitle(raw);
}

export function statusOrder(statusRaw: string): number {
  const s = String(statusRaw || '')
    .toUpperCase()
    .trim();
  if (s === 'AGUARDANDO DEFINIÇÃO DE COLETA') return 1;
  if (s === 'AGUARDANDO CHEGADA DO CLIENTE') return 2;
  if (s === 'AGUARDANDO CHEGADA DO VEÍCULO') return 2;
  if (s === 'PONTO DE COLETA SELECIONADO') return 2;
  if (s === 'AGUARDANDO APROVAÇÃO DA COLETA') return 2;
  if (s === 'AGUARDANDO COLETA') return 2;
  if (s === 'CHEGADA CONFIRMADA') return 3;
  if (s === 'EM ANÁLISE') return 4;
  if (s === 'ANÁLISE FINALIZADA') return 5;
  return 99;
}

export function canClientModify(status?: string): boolean {
  const s = String(status || '').toUpperCase();
  return (
    // s === 'AGUARDANDO DEFINIÇÃO DE COLETA' ||
    // s === 'PONTO DE COLETA SELECIONADO' ||
    // s === 'AGUARDANDO COLETA' ||
    // s === 'AGUARDANDO CHEGADA DO VEÍCULO' ||
    // s === 'AGUARDANDO CHEGADA DO CLIENTE'
    s === 'AGUARDANDO DEFINIÇÃO DE COLETA' ||
    s === 'AGUARDANDO CHEGADA DO VEÍCULO' ||
    s === 'AGUARDANDO APROVAÇÃO DA COLETA' ||
    s === 'SOLICITAÇÃO DE MUDANÇA DE DATA'
  );
}

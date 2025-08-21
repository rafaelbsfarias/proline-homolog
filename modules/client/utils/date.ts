export function formatDateBR(dateString?: string | null): string {
  if (!dateString) return '—';
  const d = new Date(dateString);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('pt-BR');
}

export function pad2(n: number): string { return String(n).padStart(2, '0'); }

export function makeLocalIsoDate(d = new Date()): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}


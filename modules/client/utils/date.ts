export function formatDateBR(dateString?: string | null): string {
  if (!dateString) return '—';
  // Evitar timezone shift quando recebemos apenas AAAA-MM-DD
  const onlyDate = /^\d{4}-\d{2}-\d{2}$/;
  if (onlyDate.test(dateString)) {
    const [y, m, d] = dateString.split('-');
    return `${d}/${m}/${y}`;
  }
  // Para strings com tempo, tentar usar Date com fallback
  const d = new Date(dateString);
  if (!Number.isNaN(d.getTime())) return d.toLocaleDateString('pt-BR');
  // Fallback final: tentar extrair AAAA-MM-DD do início da string
  const match = dateString.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const [, y, m, dd] = match;
    return `${dd}/${m}/${y}`;
  }
  return '—';
}

export function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

export function makeLocalIsoDate(d = new Date()): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

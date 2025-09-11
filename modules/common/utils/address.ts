export type AddressLike = { street?: string | null; number?: string | null; city?: string | null };

export function formatAddressLabel(a: AddressLike | null | undefined): string {
  if (!a) return '';
  const street = (a.street || '').trim();
  const number = a.number ? `, ${String(a.number).trim()}` : '';
  const city = a.city ? ` - ${String(a.city).trim()}` : '';
  return `${street}${number}${city}`.trim();
}

/**
 * Normaliza um label de endereço para comparação determinística:
 * - lowercase
 * - remove acentos/diacríticos
 * - substitui pontuação por espaço
 * - colapsa espaços
 */
export function normalizeAddressLabel(label: string | null | undefined): string {
  if (!label) return '';
  const noAccents = label
    .normalize('NFD')
    .replace(/\p{Diacritic}+/gu, '') // remove diacríticos
    .toLowerCase();
  // mantém letras/números e separa o resto por espaço, depois colapsa
  const cleaned = noAccents
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned;
}

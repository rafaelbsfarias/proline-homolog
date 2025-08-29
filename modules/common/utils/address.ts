export type AddressLike = { street?: string | null; number?: string | null; city?: string | null };

export function formatAddressLabel(a: AddressLike | null | undefined): string {
  if (!a) return '';
  const street = (a.street || '').trim();
  const number = a.number ? `, ${String(a.number).trim()}` : '';
  const city = a.city ? ` - ${String(a.city).trim()}` : '';
  return `${street}${number}${city}`.trim();
}

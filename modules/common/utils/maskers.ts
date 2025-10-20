export function maskCNPJ(value: string): string {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
    .slice(0, 18);
}

export function maskCPF(value: string): string {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
    .slice(0, 14);
}

export function maskPhone(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 10) {
    return digits.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').slice(0, 15);
  }
  return digits.replace(/(\d{2})(\d{1})(\d{4})(\d{0,4})/, '($1) $2 $3-$4').slice(0, 16);
}

export function maskCEP(value: string): string {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,3})$/, '$1-$2')
    .slice(0, 10);
}

// New/Revised formatCurrencyBRL: Takes a number and formats it to "1.234,56" (without R$)
export function formatCurrencyBRL(value: number): string {
  if (!isFinite(value)) return '';
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

// New/Revised parseCurrencyToNumber: Converts a raw input string (e.g., "1234,56") to a number (1234.56)
export function parseCurrencyToNumber(raw: string): number {
  if (!raw) return 0;
  // Remove all non-digit characters except for a single comma
  let cleaned = raw.replace(/[^0-9,]/g, '');

  // Replace comma with dot for Number conversion
  cleaned = cleaned.replace(',', '.');

  const num = Number(cleaned);
  return isNaN(num) ? 0 : num;
}

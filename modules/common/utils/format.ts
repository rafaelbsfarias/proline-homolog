export function formatCurrencyBR(value: number | null | undefined): string {
  if (typeof value !== 'number' || Number.isNaN(value)) return '-';
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function formatTotalCurrencyBR(unitValue: number | null | undefined, qty: number): string {
  if (typeof unitValue !== 'number' || Number.isNaN(unitValue)) return '-';
  const total = unitValue * (qty || 0);
  return total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

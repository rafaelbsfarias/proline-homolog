export function mapToTopCategory(inputCategory: string, itemKey?: string): string {
  const c = (inputCategory || '').toLowerCase();
  const k = (itemKey || '').toLowerCase();

  // Pintura / Funilaria
  if (c.includes('pintura') || c.includes('funilaria')) return 'Pintura/Funilaria';

  // Pneus: por categoria ou por chaves conhecidas
  if (c.includes('pneu')) return 'Pneus';
  if (['tires', 'brakepads', 'brakediscs'].some(key => k.includes(key))) return 'Pneus';

  // Lavagem
  if (c.includes('lavagem') || c.includes('wash')) return 'Lavagem';

  // Elétrica, Motor, Suspensão, Ar Condicionado, Bateria etc. → Mecânica
  return 'Mecânica';
}

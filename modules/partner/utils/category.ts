function normalize(str?: string): string {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[\s_-]+/g, ' ')
    .trim();
}

export function normalizePartnerCategoryName(categories?: unknown): string {
  const arr = Array.isArray(categories) ? (categories as unknown[]).map(String) : [];
  const normalized = arr.map(c => normalize(String(c)));

  // Pintura/Funilaria
  if (
    normalized.some(
      c =>
        c.includes('pintura') ||
        c.includes('funilaria') ||
        c.includes('body paint') ||
        c.includes('lataria')
    )
  )
    return 'Pintura/Funilaria';

  // Mecânica
  if (normalized.some(c => c.includes('mecan') || c.includes('mechanic'))) return 'Mecânica';

  // Pneus
  if (normalized.some(c => c.includes('pneu') || c.includes('tire'))) return 'Pneus';

  // Lavagem
  if (normalized.some(c => c.includes('lavagem') || c.includes('wash'))) return 'Lavagem';

  // Loja / Varejo
  if (normalized.some(c => c.includes('loja') || c.includes('retail'))) return 'Loja';

  // Pátio Atacado
  if (normalized.some(c => c.includes('patio atacado') || c.includes('atacado'))) {
    return 'Pátio Atacado';
  }

  // Fallback genérico
  return 'Parceiro';
}

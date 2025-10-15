/**
 * Concatena notas não-vazias com separador
 */
export function concatNotes(notes: (string | undefined)[]): string | null {
  const filtered = notes.filter(n => !!n && String(n).trim() !== '').join(' | ');
  return filtered || null;
}

/**
 * Filtra e limpa uma nota individual
 */
export function cleanNote(note?: string): string | null {
  if (!note || String(note).trim() === '') return null;
  return String(note).trim();
}

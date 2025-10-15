/**
 * Capitaliza um título no padrão de título (Title Case)
 * Mantém acrônimos em maiúsculas se já estiverem assim
 *
 * Exemplos:
 * - "AGUARDANDO DEFINIÇÃO DE COLETA" → "Aguardando Definição de Coleta"
 * - "Veículo Cadastrado" → "Veículo Cadastrado"
 * - "EM ANÁLISE" → "Em Análise"
 */
export function capitalizeTitle(text: string): string {
  if (!text) return '';

  const trimmed = text.trim();

  // Palavras que devem permanecer em minúsculas (exceto se forem a primeira palavra)
  const lowercaseWords = new Set(['de', 'da', 'do', 'das', 'dos', 'e', 'a', 'o', 'para']);

  const words = trimmed.split(/\s+/);

  return words
    .map((word, index) => {
      const lowerWord = word.toLowerCase();

      // Primeira palavra sempre capitalizada
      if (index === 0) {
        return lowerWord.charAt(0).toUpperCase() + lowerWord.slice(1);
      }

      // Palavras pequenas permanecem em minúsculas
      if (lowercaseWords.has(lowerWord)) {
        return lowerWord;
      }

      // Capitalizar primeira letra
      return lowerWord.charAt(0).toUpperCase() + lowerWord.slice(1);
    })
    .join(' ');
}

/**
 * Normaliza um status do sistema para exibição
 * Aplica capitalização de título e remove espaços extras
 */
export function normalizeStatusDisplay(status?: string): string {
  if (!status) return '';
  return capitalizeTitle(status);
}

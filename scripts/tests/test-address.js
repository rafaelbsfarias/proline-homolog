// Teste simples da formatação de endereço
const testAddress = { street: 'general labatut', number: '12388', city: 'salvador' };

function formatAddressLabel(a) {
  if (!a) return '';
  const street = (a.street || '').trim();
  const number = a.number ? `, ${String(a.number).trim()}` : '';
  const city = a.city ? ` - ${String(a.city).trim()}` : '';
  return `${street}${number}${city}`.trim();
}

function normalizeAddressLabel(label) {
  if (!label) return '';
  const noAccents = label
    .normalize('NFD')
    .replace(/\p{Diacritic}+/gu, '')
    .toLowerCase();
  const cleaned = noAccents
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned;
}

const addressLabel = formatAddressLabel(testAddress);
const normalizedLabel = normalizeAddressLabel(addressLabel);

console.log('=== ADDRESS FORMATTING TEST ===');
console.log('Input:', testAddress);
console.log('Formatted:', `"${addressLabel}"`);
console.log('Normalized:', `"${normalizedLabel}"`);
console.log('Length:', addressLabel.length);
console.log('Expected DB format:', '"general labatut, 12388 - salvador"');

// Teste de comparação
const expectedInDb = 'general labatut, 12388 - salvador';
console.log('\n=== COMPARISON TEST ===');
console.log('Exact match:', addressLabel === expectedInDb);
console.log('Case insensitive match:', addressLabel.toLowerCase() === expectedInDb.toLowerCase());
console.log('Contains match:', expectedInDb.includes('general labatut'));

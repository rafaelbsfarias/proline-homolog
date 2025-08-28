export const pad2 = (n: number | string) => String(n).padStart(2, '0');

export const isoToBr = (iso: string) => {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  if (!y || !m || !d) return '';
  return `${d}/${m}/${y}`;
};

export const brToIso = (br: string) => {
  const [d, m, y] = (br || '').split('/');
  if (!d || !m || !y || y.length !== 4) return '';
  return `${y}-${pad2(m)}-${pad2(d)}`;
};

export const todayLocalIso = () => {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 10);
};

export type DateCell = { iso?: string; label?: string; disabled?: boolean };

export const buildMonthDays = (
  year: number,
  monthZeroBased: number,
  minIso: string,
  disabledSet?: Set<string>
): DateCell[] => {
  const first = new Date(year, monthZeroBased, 1);
  const last = new Date(year, monthZeroBased + 1, 0);
  const startPad = first.getDay(); // 0=Dom
  const items: DateCell[] = [];
  for (let i = 0; i < startPad; i++) items.push({});
  for (let d = 1; d <= last.getDate(); d++) {
    const iso = `${year}-${pad2(monthZeroBased + 1)}-${pad2(d)}`;
    const disabled = iso < minIso || (disabledSet ? disabledSet.has(iso) : false);
    items.push({ iso, label: String(d), disabled });
  }
  return items;
};

export const labelOf = (a: any) =>
  `${a?.street || ''}${a?.number ? ', ' + a.number : ''}${a?.city ? ' - ' + a.city : ''}`.trim();

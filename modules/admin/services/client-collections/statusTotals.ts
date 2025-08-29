export async function getStatusTotals(
  admin: any,
  clientId: string
): Promise<{ status: string; count: number }[]> {
  const { data: allStatusRows } = await admin
    .from('vehicles')
    .select('status')
    .eq('client_id', clientId);
  const totals: Record<string, number> = {};
  (allStatusRows || []).forEach((row: any) => {
    const st = String(row?.status || '')
      .toUpperCase()
      .trim();
    if (!st) return;
    totals[st] = (totals[st] || 0) + 1;
  });
  return Object.entries(totals).map(([k, v]) => ({ status: k, count: v as number }));
}

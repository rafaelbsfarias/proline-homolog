// Helper to attach standardized fields to logs
export function logFields(params: {
  client_id?: string | null;
  address_id?: string | null;
  address_label?: string | null;
  date?: string | null;
  collection_id?: string | null;
}) {
  const out: Record<string, string> = {};
  if (params.client_id) out.client_id = String(params.client_id);
  if (params.address_id) out.address_id = String(params.address_id);
  if (params.address_label) out.address_label = String(params.address_label);
  if (params.date) out.date = String(params.date);
  if (params.collection_id) out.collection_id = String(params.collection_id);
  return out;
}

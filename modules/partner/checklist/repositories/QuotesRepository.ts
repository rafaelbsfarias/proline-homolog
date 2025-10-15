import { createClient } from '@/lib/supabase/server';

export type QuoteWithPartner = {
  id: string;
  partner_id: string | null;
  partners?:
    | { id: string; name: string; partner_type: string }
    | { id: string; name: string; partner_type: string }[]
    | null;
};

export async function getApprovedQuoteByVehicle(
  vehicleId: string
): Promise<QuoteWithPartner | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('quotes')
    .select(`id, partner_id, partners ( id, name, partner_type )`)
    .eq('vehicle_id', vehicleId)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return null;
  return (data as QuoteWithPartner) ?? null;
}

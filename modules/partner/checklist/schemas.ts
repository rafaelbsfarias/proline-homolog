import { z } from 'zod';

export const QuerySchema = z.object({
  vehicleId: z.string().min(1, 'vehicleId é obrigatório'),
});

export type QueryParams = z.infer<typeof QuerySchema>;

export type Partner = {
  id: string;
  name: string;
  partner_type: string;
};

export type EvidenceRow = {
  id: string;
  media_url: string; // FIX: tabela consolidada usa media_url (não storage_path)
  media_type?: string;
  description: string | null;
  item_key: string;
  partner_id?: string;
  quote_id?: string | null;
  inspection_id?: string | null;
};

export type ChecklistItemRow = {
  id: string;
  item_key: string;
  item_status: string;
  item_notes: string | null;
  created_at?: string;
  quote_id?: string | null;
  inspection_id?: string | null;
};

export type AnomalyRow = {
  id: string;
  description: string;
  photos: string[];
  severity: string | null;
  status: string | null;
  created_at: string;
};

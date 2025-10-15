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
  storage_path: string; // Updated to use storage_path column
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
  // JSON com solicitação de peça associada ao item (quando houver)
  // pode vir em diferentes convenções de chave (partName/part_name, etc.)
  // por isso mantemos como unknown aqui e normalizamos no mapper
  part_request?: unknown;
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

export interface EvidenceRecord {
  item_key: string;
  storage_path: string;
  inspection_id?: string | null;
  quote_id?: string | null;
}

export interface EvidenceMap {
  [itemKey: string]: {
    url: string;
  };
}

export interface SignedUrlOptions {
  expiresIn?: number; // Segundos
  bucket?: string;
}

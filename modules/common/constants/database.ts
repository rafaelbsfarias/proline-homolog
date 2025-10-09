/**
 * Constantes de Database - Centralização de Strings
 *
 * Este módulo centraliza todas as strings relacionadas ao banco de dados
 * (tabelas, buckets, schemas) para evitar duplicação e facilitar manutenção.
 *
 * Princípios aplicados:
 * - DRY: Single Source of Truth para nomes de recursos
 * - Manutenibilidade: Mudanças em um único lugar
 * - Type Safety: IntelliSense para nomes de tabelas/buckets
 */

/**
 * Nomes de tabelas do Supabase
 */
export const TABLES = {
  // Partner Domain
  QUOTES: 'quotes',
  PARTNER_SERVICES: 'partner-services',

  // Checklist Domain
  MECHANICS_CHECKLIST: 'mechanics_checklist',
  MECHANICS_CHECKLIST_ITEMS: 'mechanics_checklist_items',
  MECHANICS_CHECKLIST_EVIDENCES: 'mechanics_checklist_evidences',

  // Vehicles Domain
  VEHICLE_ANOMALIES: 'vehicle_anomalies',
  VEHICLES: 'vehicles',

  // Collections Domain
  COLLECTIONS: 'collections',
  COLLECTION_VEHICLES: 'collection_vehicles',
} as const;

/**
 * Nomes de buckets do Supabase Storage
 */
export const BUCKETS = {
  VEHICLE_MEDIA: 'vehicle-media',
} as const;

/**
 * Status padrão para recursos
 */
export const STATUS = {
  SUBMITTED: 'submitted',
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

/**
 * Type helpers para garantir type-safety
 */
export type TableName = (typeof TABLES)[keyof typeof TABLES];
export type BucketName = (typeof BUCKETS)[keyof typeof BUCKETS];
export type StatusValue = (typeof STATUS)[keyof typeof STATUS];

/**
 * Types for Partner Overview Module
 *
 * Following project patterns:
 * - No 'any' types (progressive replacement)
 * - Based on actual API responses from /api/admin/partners/[partnerId]/overview
 * - Based on actual API responses from /api/admin/partners/[partnerId]/services
 */

// ============================================================================
// Quote Types
// ============================================================================

/**
 * Quote status types matching database schema
 * Legacy 'admin_review' is mapped to 'pending_admin_approval' in API
 */
export type QuoteStatus =
  | 'pending_admin_approval'
  | 'pending_client_approval'
  | 'approved'
  | 'rejected'
  | 'executing';

/**
 * Quote structure returned from API
 * Based on /api/admin/partners/[partnerId]/overview/route.ts
 * Extended with vehicle_id from /api/admin/quotes/[quoteId]/route.ts
 */
export interface Quote {
  id: string;
  created_at: string;
  status: QuoteStatus;
  total_value: number | null;
  service_order_id: string | null;
  vehicle_id?: string | null; // Available when fetching quote details
}

/**
 * Quote item structure for detailed view
 * Used in quote details modal
 */
export interface QuoteItem {
  id: string;
  quote_id: string;
  service_id: string | null;
  service_name: string | null;
  description: string | null;
  quantity: number;
  unit_price: number | null;
  total_price: number | null;
  created_at?: string;
}

/**
 * Quotes grouped by status
 * Returned from /api/admin/partners/[partnerId]/overview
 */
export interface QuotesByStatus {
  pending_admin_approval: Quote[];
  pending_client_approval: Quote[];
  approved: Quote[];
  rejected: Quote[];
  executing: Quote[];
}

/**
 * Quote with detailed items
 * Used in modals and detailed views
 */
export interface QuoteWithItems {
  quote: Quote;
  items: QuoteItem[];
}

// ============================================================================
// Partner Types
// ============================================================================

/**
 * Partner metrics summary
 * Based on /api/admin/partners/[partnerId]/overview response
 */
export interface PartnerMetrics {
  services_count: number;
  pending_budgets: number;
  executing_budgets: number;
  approval_budgets: number;
}

/**
 * Partner summary with quotes
 * Main data structure for overview page
 */
export interface Partner extends PartnerMetrics {
  id: string;
  company_name: string;
  is_active?: boolean;
  quotes?: QuotesByStatus;
}

// ============================================================================
// Service Types
// ============================================================================

/**
 * Service structure
 * Based on /api/admin/partners/[partnerId]/services response
 */
export interface Service {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  is_active: boolean;
  review_status: 'approved' | 'pending_review' | 'in_revision';
  review_feedback: string | null;
  review_requested_at: string | null;
  created_at: string;
}

/**
 * Service filter status options
 */
export type ServiceFilterStatus = 'all' | 'active' | 'inactive';

// ============================================================================
// Filter Types
// ============================================================================

/**
 * Quote filter status options
 * Includes 'all' for showing all statuses
 */
export type QuoteFilterStatus = 'all' | QuoteStatus;

/**
 * Quote with internal group classification
 * Used for filtering across all status groups
 */
export interface QuoteWithGroup extends Quote {
  _group: QuoteStatus;
}

// ============================================================================
// Modal State Types
// ============================================================================

/**
 * Quote details modal state
 */
export interface QuoteDetailsState {
  isOpen: boolean;
  data: QuoteWithItems | null;
}

/**
 * Quote review modal state
 */
export interface QuoteReviewState {
  isOpen: boolean;
  data: QuoteWithItems | null;
}

/**
 * Checklist modal state
 */
export interface ChecklistModalState {
  isOpen: boolean;
  vehicleId: string | null;
}

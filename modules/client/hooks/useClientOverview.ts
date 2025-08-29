import { useClientCollectionSummary } from './useClientCollectionSummary';
import { usePendingApprovalVehicles } from './usePendingApprovalVehicles';

// Thin composition hook to centralize Client Dashboard data access.
// Starts by reusing collection summary and can grow incrementally.
export function useClientOverview() {
  const summary = useClientCollectionSummary();
  const pendingApprovals = usePendingApprovalVehicles();

  return {
    // collections summary
    collections: summary,
    // pending approvals/reschedule actions
    approvals: pendingApprovals,
  } as const;
}

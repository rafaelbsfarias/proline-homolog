export type TimelineEventType =
  | 'BUDGET_STARTED'
  | 'BUDGET_APPROVED'
  | 'EXECUTION_STARTED'
  | 'SERVICE_COMPLETED'
  | 'EXECUTION_COMPLETED';

export interface TimelineEvent {
  id: string;
  vehicleId: string;
  type: TimelineEventType;
  title: string;
  date: string; // ISO string
  meta?: Record<string, unknown>;
}

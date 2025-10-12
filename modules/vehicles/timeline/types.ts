export type TimelineEventType = 'BUDGET_STARTED' | 'BUDGET_APPROVED';

export interface TimelineEvent {
  id: string;
  vehicleId: string;
  type: TimelineEventType;
  title: string;
  date: string; // ISO string
  meta?: Record<string, unknown>;
}

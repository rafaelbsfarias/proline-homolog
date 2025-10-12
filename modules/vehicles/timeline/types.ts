export type TimelineEventType = 'BUDGET_STARTED';

export interface TimelineEvent {
  id: string;
  vehicleId: string;
  type: TimelineEventType;
  title: string;
  date: string; // ISO string
  meta?: Record<string, unknown>;
}

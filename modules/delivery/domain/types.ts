export type UUID = string;

export enum DeliveryMethod {
  Delivery = 'delivery',
  Pickup = 'pickup',
}

export enum DeliveryStatus {
  Requested = 'requested',
  Approved = 'approved',
  Scheduled = 'scheduled',
  InTransit = 'in_transit',
  Delivered = 'delivered',
  Canceled = 'canceled',
  Rejected = 'rejected',
}

export type ISODate = string; // YYYY-MM-DD
export type ISODateTime = string; // toISOString()

export interface PickupWindow {
  start: ISODateTime;
  end: ISODateTime;
}

export interface DeliveryRequest {
  id: UUID;
  vehicle_id: UUID;
  client_id: UUID;
  service_order_id: UUID | null;
  address_id: UUID | null; // null => pickup (no pátio)
  status: DeliveryStatus;
  desired_date: ISODate | null;
  window_start?: ISODateTime | null;
  window_end?: ISODateTime | null;
  scheduled_at?: ISODateTime | null;
  created_by: UUID;
  fee_amount?: number | null; // valor da entrega/retirada
}

export function makeWindowFromDate(dateIso: ISODate, startHour = 9, endHour = 18): PickupWindow {
  const [y, m, d] = dateIso.split('-').map(Number);
  const start = new Date(
    Date.UTC(y as number, ((m as number) - 1) as number, d as number, startHour, 0, 0)
  );
  const end = new Date(
    Date.UTC(y as number, ((m as number) - 1) as number, d as number, endHour, 0, 0)
  );
  return { start: start.toISOString(), end: end.toISOString() };
}

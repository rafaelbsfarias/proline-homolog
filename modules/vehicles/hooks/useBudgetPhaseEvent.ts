'use client';

import { useMemo } from 'react';
import { useVehicleHistory } from '@/modules/vehicles/hooks/useVehicleHistory';

export type UserRole = 'client' | 'specialist' | 'admin' | 'partner';

export interface BudgetPhaseEvent {
  title: string;
  date: string; // ISO
}

export function useBudgetPhaseEvent(role: UserRole, vehicleId?: string) {
  const { history, loading, error } = useVehicleHistory(role, vehicleId);

  const event: BudgetPhaseEvent | null = useMemo(() => {
    if (!history?.length) return null;
    const entry = history.find(h =>
      (h.status || '').toLowerCase().startsWith('fase orçamentária iniciada')
    );
    if (!entry) return null;
    return { title: entry.status, date: entry.created_at };
  }, [history]);

  return { event, loading, error } as const;
}

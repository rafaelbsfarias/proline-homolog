/**
 * Hook for filtering services
 *
 * Responsibilities:
 * - Filter services by search query (name)
 * - Filter services by status (active/inactive/all)
 * - Memoize filtered results for performance
 */

import { useState, useMemo } from 'react';
import type { Service, ServiceFilterStatus } from '../types';

interface UseServiceFiltersReturn {
  query: string;
  setQuery: (query: string) => void;
  status: ServiceFilterStatus;
  setStatus: (status: ServiceFilterStatus) => void;
  filteredServices: Service[];
}

export function useServiceFilters(services: Service[]): UseServiceFiltersReturn {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<ServiceFilterStatus>('all');

  const filteredServices = useMemo(() => {
    const q = query.trim().toLowerCase();

    return services.filter(s => {
      const byName = !q || s.name.toLowerCase().includes(q);
      if (!byName) return false;

      switch (status) {
        case 'active':
          return s.is_active;
        case 'inactive':
          return !s.is_active;
        default:
          return true;
      }
    });
  }, [services, query, status]);

  return {
    query,
    setQuery,
    status,
    setStatus,
    filteredServices,
  };
}

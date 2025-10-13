/**
 * Hook for filtering quotes
 *
 * Responsibilities:
 * - Filter quotes by search query (ID or service_order_id)
 * - Filter quotes by status
 * - Flatten quotes from all status groups
 * - Memoize filtered results for performance
 */

import { useState, useMemo } from 'react';
import type { QuotesByStatus, QuoteFilterStatus, QuoteStatus, Quote } from '../types';

interface UseQuoteFiltersReturn {
  query: string;
  setQuery: (query: string) => void;
  status: QuoteFilterStatus;
  setStatus: (status: QuoteFilterStatus) => void;
  filteredQuotes: Array<Quote & { _group: QuoteStatus }>;
}

export function useQuoteFilters(quotes: QuotesByStatus | null): UseQuoteFiltersReturn {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<QuoteFilterStatus>('pending_admin_approval');

  const filteredQuotes = useMemo(() => {
    const q = query.trim().toLowerCase();
    const flatten: Array<Quote & { _group: QuoteStatus }> = [];

    if (quotes) {
      const keys: (keyof QuotesByStatus)[] = [
        'pending_admin_approval',
        'pending_client_approval',
        'approved',
        'rejected',
        'executing',
      ];

      keys.forEach(k => {
        if (status === 'all' || status === k) {
          (quotes[k] || []).forEach(item => flatten.push({ ...item, _group: k }));
        }
      });
    }

    return flatten.filter(item => {
      if (!q) return true;
      return (
        String(item.id).toLowerCase().includes(q) ||
        String(item.service_order_id || '')
          .toLowerCase()
          .includes(q)
      );
    });
  }, [quotes, query, status]);

  return {
    query,
    setQuery,
    status,
    setStatus,
    filteredQuotes,
  };
}

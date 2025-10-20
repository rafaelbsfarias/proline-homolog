'use client';
import React, { useEffect, useState } from 'react';
import styles from './Toolbar.module.css';
import { useRouter } from 'next/navigation';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';

interface PendingQuotesCounterProps {
  onLoadingChange?: (loading: boolean) => void;
}

const PendingQuotesCounter: React.FC<PendingQuotesCounterProps> = ({ onLoadingChange }) => {
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { get } = useAuthenticatedFetch();

  useEffect(() => {
    onLoadingChange?.(loading);
  }, [loading, onLoadingChange]);

  useEffect(() => {
    const fetchCount = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await get<{ count: number; error?: string }>(
          '/api/admin/quotes/pending-count'
        );
        if (response.ok && typeof response.data?.count === 'number') {
          setCount(response.data.count);
        } else {
          setError(response.data?.error || 'Erro ao buscar orçamentos');
          setCount(null);
        }
      } catch (err: any) {
        setError('Erro ao buscar orçamentos');
        setCount(null);
      }
      setLoading(false);
    };
    fetchCount();
  }, [get]);

  if (loading) return <span className={styles.counterCard}>Carregando...</span>;
  if (error) return <span className={styles.counterCard}>{error}</span>;
  // Hide the counter when there are zero pending quotes
  if (count === 0) return null;
  return (
    <span
      className={styles.counterCard}
      style={{ cursor: 'pointer' }}
      title="Ver orçamentos pendentes (Admin)"
      onClick={() => router.push('/dashboard/admin/quotes/pending')}
    >
      Orçamentos para Aprovação: {count}
    </span>
  );
};

export default PendingQuotesCounter;

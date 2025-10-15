'use client';

import React, { useEffect, useState } from 'react';
import styles from './Toolbar.module.css'; // Reusing styles
import { useRouter } from 'next/navigation';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';

interface PendingDelegationsCounterProps {
  onLoadingChange?: (loading: boolean) => void;
}

const PendingDelegationsCounter: React.FC<PendingDelegationsCounterProps> = ({
  onLoadingChange,
}) => {
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { get } = useAuthenticatedFetch();

  useEffect(() => {
    onLoadingChange?.(loading);
  }, [loading, onLoadingChange]);

  useEffect(() => {
    const fetchCount = async () => {
      setLoading(true);
      try {
        const response = await get<{ count: number }>('/api/admin/pending-checklist-reviews/count');

        if (response.ok && response.data) {
          setCount(response.data.count);
        } else {
          setCount(0);
        }
      } catch {
        setCount(0);
      } finally {
        setLoading(false);
      }
    };
    fetchCount();
  }, [get]);

  if (loading) return <span className={styles.counterCard}>Carregando...</span>;

  return (
    <span
      className={styles.counterCard}
      style={{ cursor: 'pointer' }}
      title="Ver delegações de serviço pendentes"
      onClick={() => router.push('/admin/service-delegation')}
    >
      Delegações Pendentes: {count}
    </span>
  );
};

export default PendingDelegationsCounter;

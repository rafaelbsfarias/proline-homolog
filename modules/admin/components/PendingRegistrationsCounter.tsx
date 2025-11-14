'use client';

import React, { useEffect, useState } from 'react';
import styles from './PendingRegistrationsCounter.module.css';
import { useRouter } from 'next/navigation';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';

interface PendingRegistrationsCounterProps {
  onLoadingChange?: (loading: boolean) => void;
}

const PendingRegistrationsCounter: React.FC<PendingRegistrationsCounterProps> = ({
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
        // A API retorna um array direto, não um objeto com total
        const response = await get<unknown[]>('/api/admin/cadastros-pendentes');

        if (response.ok && response.data) {
          // Contar o número de itens no array
          setCount(Array.isArray(response.data) ? response.data.length : 0);
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

  // Não exibir o contador se não houver pendências
  if (count === 0) return null;

  return (
    <span
      className={`${styles.counterCard} ${count && count > 0 ? styles.urgent : ''}`}
      style={{ cursor: 'pointer' }}
      title="Ver cadastros pendentes"
      onClick={() => router.push('/admin/pendentes')}
    >
      Cadastros Pendentes: {count}
    </span>
  );
};

export default PendingRegistrationsCounter;

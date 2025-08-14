'use client';

import React, { useEffect, useState } from 'react';
import styles from './Toolbar.module.css';
import { useRouter } from 'next/navigation';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';

const PendingRegistrationsCounter: React.FC = () => {
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { get } = useAuthenticatedFetch();

  useEffect(() => {
    const fetchCount = async () => {
      setLoading(true);
      try {
        // A API retorna um array direto, não um objeto com total
        const response = await get<Array<any>>('/api/admin/cadastros-pendentes');

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
  return (
    <span
      className={styles.counterCard}
      style={{ cursor: 'pointer' }}
      title="Ver cadastros pendentes"
      onClick={() => router.push('/admin/pendentes')}
    >
      Cadastros pendentes: {count}
    </span>
  );
};

export default PendingRegistrationsCounter;

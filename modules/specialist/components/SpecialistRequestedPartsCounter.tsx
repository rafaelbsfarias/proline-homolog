'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';
import styles from '@/modules/admin/components/Toolbar.module.css';

interface SpecialistRequestedPartsCounterProps {
  onLoadingChange?: (loading: boolean) => void;
}

const SpecialistRequestedPartsCounter: React.FC<SpecialistRequestedPartsCounterProps> = ({
  onLoadingChange,
}) => {
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
          '/api/specialist/part-requests/pending-count'
        );
        if (response.ok && typeof response.data?.count === 'number') {
          setCount(response.data.count);
        } else {
          setError(response.data?.error || 'Erro ao buscar peças solicitadas');
          setCount(null);
        }
      } catch {
        setError('Erro ao buscar peças solicitadas');
        setCount(null);
      }
      setLoading(false);
    };
    fetchCount();
  }, [get]);

  if (loading) return <span className={styles.counterCard}>Carregando...</span>;
  if (error) return <span className={styles.counterCard}>{error}</span>;

  // Não exibir o contador se não houver peças solicitadas pendentes
  if (count === 0) return null;

  return (
    <span
      className={styles.counterCard}
      style={{ cursor: 'pointer' }}
      title="Ver peças solicitadas pendentes dos seus clientes"
      onClick={() => router.push('/dashboard/admin/requested-parts')}
    >
      Peças solicitadas: {count}
    </span>
  );
};

export default SpecialistRequestedPartsCounter;

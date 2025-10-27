'use client';
import React, { useEffect, useState } from 'react';
import styles from './Toolbar.module.css';
import { useRouter } from 'next/navigation';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';

interface CommercializationVehiclesCounterProps {
  onLoadingChange?: (loading: boolean) => void;
}

const CommercializationVehiclesCounter: React.FC<CommercializationVehiclesCounterProps> = ({
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
        const response = await get<{ success: boolean; count: number; error?: string }>(
          '/api/admin/commercialization-vehicles-count'
        );
        if (response.ok && typeof response.data?.count === 'number') {
          setCount(response.data.count);
        } else {
          setError(response.data?.error || 'Erro ao buscar veículos em comercialização');
          setCount(null);
        }
      } catch {
        setError('Erro ao buscar veículos em comercialização');
        setCount(null);
      }
      setLoading(false);
    };
    fetchCount();
  }, [get]);

  if (loading) return <span className={styles.counterCard}>Carregando...</span>;
  if (error) return <span className={styles.counterCard}>{error}</span>;
  if (count === 0) return null;

  return (
    <span
      className={styles.counterCard}
      style={{ cursor: count && count > 0 ? 'pointer' : 'default' }}
      title="Ver veículos em comercialização"
      onClick={() => {
        if (count && count > 0) router.push('/admin/vehicles?comercializacao=true');
      }}
    >
      Comercialização: {typeof count === 'number' ? count : '—'}
    </span>
  );
};

export default CommercializationVehiclesCounter;

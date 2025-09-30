'use client';
import React, { useEffect, useState } from 'react';
import styles from './Toolbar.module.css';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';

interface VehiclesPendingApprovalCounterProps {
  onLoadingChange?: (loading: boolean) => void;
}

const VehiclesPendingApprovalCounter: React.FC<VehiclesPendingApprovalCounterProps> = ({
  onLoadingChange,
}) => {
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
          '/api/admin/vehicles/pending-approval-count'
        );
        if (response.ok && typeof response.data?.count === 'number') {
          setCount(response.data.count);
        } else {
          setError(response.data?.error || 'Erro ao buscar veículos');
          setCount(null);
        }
      } catch (err: any) {
        setError('Erro ao buscar veículos');
        setCount(null);
      }
      setLoading(false);
    };
    fetchCount();
  }, [get]);

  if (loading) return <span className={styles.counterCard}>Carregando...</span>;
  if (error) return <span className={styles.counterCard}>{error}</span>;
  return (
    <span className={styles.counterCard} title="Veículos aguardando orçamento">
      Veículos para orçamento: {count}
    </span>
  );
};

export default VehiclesPendingApprovalCounter;

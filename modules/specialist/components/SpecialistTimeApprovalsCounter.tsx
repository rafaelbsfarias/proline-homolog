'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';
import styles from '@/modules/admin/components/Toolbar.module.css';

interface SpecialistTimeApprovalsCounterProps {
  onLoadingChange?: (loading: boolean) => void;
}

const SpecialistTimeApprovalsCounter: React.FC<SpecialistTimeApprovalsCounterProps> = ({
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
        const response = await get<{ data: any[]; error?: string }>(
          '/api/specialist/quotes/pending-time-approval'
        );
        if (response.ok && response.data?.data) {
          setCount(response.data.data.length);
        } else {
          setError(response.data?.error || 'Erro ao buscar aprovações pendentes');
          setCount(null);
        }
      } catch {
        setError('Erro ao buscar aprovações pendentes');
        setCount(null);
      }
      setLoading(false);
    };
    fetchCount();
  }, [get]);

  if (loading) return <span className={styles.counterCard}>Carregando...</span>;
  if (error) return <span className={styles.counterCard}>{error}</span>;
  if (count === 0) return null; // Não mostrar se não há pendências

  return (
    <span
      className={styles.counterCard}
      style={{ cursor: 'pointer' }}
      title="Orçamentos aguardando aprovação de prazos"
      onClick={() => router.push('/dashboard/specialist/time-approvals')}
    >
      Aprovações de prazo: {count}
    </span>
  );
};

export default SpecialistTimeApprovalsCounter;

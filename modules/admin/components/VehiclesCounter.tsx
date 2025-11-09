'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import styles from './Toolbar.module.css';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';

interface VehiclesCounterProps {
  onLoadingChange?: (loading: boolean) => void;
}

const VehiclesCounter: React.FC<VehiclesCounterProps> = ({ onLoadingChange }) => {
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const { get } = useAuthenticatedFetch();

  useEffect(() => {
    onLoadingChange?.(loading);
  }, [loading, onLoadingChange]);

  useEffect(() => {
    const fetchCount = async () => {
      setLoading(true);
      try {
        // Busca total de veículos cadastrados (todos os clientes)
        const response = await get<{
          success: boolean;
          clients: { vehicle_count: number | null }[];
          error?: string;
        }>('/api/admin/clients-with-vehicle-count');
        if (response.ok && response.data?.success) {
          // Soma todos os veículos dos clientes
          const total = response.data.clients.reduce(
            (acc, c) => acc + (typeof c.vehicle_count === 'number' ? c.vehicle_count : 0),
            0
          );
          setCount(total);
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
    <Link
      href="/admin/vehicles"
      className={styles.counterCard}
      title="Ver listagem geral de veículos"
    >
      Veículos: {count}
    </Link>
  );
};

export default VehiclesCounter;

'use client';

import React from 'react';
import styles from './Toolbar.module.css';
import { useRouter } from 'next/navigation';

const GeneralFinancialSummaryButton: React.FC = () => {
  const router = useRouter();

  return (
    <span
      className={styles.counterCard}
      style={{ cursor: 'pointer' }}
      title="Ver Resumo Financeiro Geral"
      onClick={() => router.push('/dashboard/admin/financial-overview')}
    >
      Resumo Financeiro Geral
    </span>
  );
};

export default GeneralFinancialSummaryButton;

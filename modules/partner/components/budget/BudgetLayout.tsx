'use client';

import React from 'react';
import Header from '@/modules/admin/components/Header';

interface BudgetLayoutProps {
  children: React.ReactNode;
}

const BudgetLayout: React.FC<BudgetLayoutProps> = ({ children }) => {
  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <Header />
      <div style={{ padding: '24px' }}>{children}</div>
    </div>
  );
};

export default BudgetLayout;

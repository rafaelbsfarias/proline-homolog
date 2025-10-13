'use client';
import Header from '@/modules/admin/components/Header';
import FinancialOverview from '@/modules/common/components/FinancialOverview/FinancialOverview';
import { use } from 'react';

export default function ClientOverviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return (
    <>
      <Header />
      <FinancialOverview clientId={id} />
    </>
  );
}

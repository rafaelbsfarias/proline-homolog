'use client';
import Header from '@/modules/admin/components/Header';
import FinancialOverview from '@/modules/common/components/FinancialOverview/FinancialOverview';
import DeliveryRequestsCard from '@/modules/admin/components/DeliveryRequestsCard';
import { use } from 'react';

export default function AdminClientOverviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return (
    <>
      <Header />
      <FinancialOverview clientId={id} />
      {/* Exibe o card somente quando houver solicitações pendentes (o próprio card esconde se vazio) */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px' }}>
        <DeliveryRequestsCard clientId={id} />
      </div>
    </>
  );
}

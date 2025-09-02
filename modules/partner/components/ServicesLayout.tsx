'use client';

import React from 'react';
import Header from '@/modules/admin/components/Header';
import ServicesSidebar from './ServicesSidebar';
import { PartnerService } from '@/modules/partner/hooks/usePartnerServices';

interface ServicesLayoutProps {
  children: React.ReactNode;
  services?: PartnerService[];
  onServiceSelect?: (service: PartnerService) => void;
  selectedServiceId?: string;
}

const ServicesLayout: React.FC<ServicesLayoutProps> = ({
  children,
  services = [],
  onServiceSelect,
  selectedServiceId,
}) => {
  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <Header />
      <div style={{ display: 'flex' }}>
        {/* Menu Lateral com Pesquisa e Árvore */}
        <ServicesSidebar
          services={services}
          onServiceSelect={onServiceSelect}
          selectedServiceId={selectedServiceId}
        />

        {/* Conteúdo Principal */}
        <main style={{ flex: 1, padding: '48px' }}>{children}</main>
      </div>
    </div>
  );
};

export default ServicesLayout;

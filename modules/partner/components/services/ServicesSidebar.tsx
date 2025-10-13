'use client';

import React, { useState, useMemo } from 'react';
import { PartnerService } from '@/modules/partner/hooks/usePartnerServices';
import SearchInput from '../SearchInput';
import CategoryTree from '../CategoryTree';

interface ServicesSidebarProps {
  services: PartnerService[];
  onServiceSelect?: (service: PartnerService) => void;
  selectedServiceId?: string;
}

const ServicesSidebar: React.FC<ServicesSidebarProps> = ({
  services,
  onServiceSelect,
  selectedServiceId,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Filtrar serviços baseado no termo de pesquisa
  const filteredServices = useMemo(() => {
    // Garantir que services é um array válido
    if (!Array.isArray(services)) return [];
    if (!searchTerm) return services;

    return services.filter(
      service =>
        service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [services, searchTerm]);

  // Organizar serviços por categoria
  const servicesByCategory = useMemo(() => {
    const categorized: Record<string, PartnerService[]> = {};
    const uncategorized: PartnerService[] = [];

    filteredServices.forEach(service => {
      if (service.category && service.category.trim()) {
        if (!categorized[service.category]) {
          categorized[service.category] = [];
        }
        categorized[service.category].push(service);
      } else {
        uncategorized.push(service);
      }
    });

    return { categorized, uncategorized };
  }, [filteredServices]);

  return (
    <aside
      style={{
        width: '280px',
        background: '#ffffff',
        borderRight: '1px solid #e5e7eb',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 80px)', // Altura da viewport menos o header
        overflow: 'hidden',
      }}
    >
      {/* Título */}
      <div style={{ marginBottom: '20px' }}>
        <h2
          style={{
            fontSize: '18px',
            fontWeight: 600,
            color: '#111827',
            margin: 0,
          }}
        >
          Serviços
        </h2>
        <p
          style={{
            fontSize: '14px',
            color: '#6b7280',
            margin: '4px 0 0 0',
          }}
        >
          {filteredServices.length} serviço{filteredServices.length !== 1 ? 's' : ''} encontrado
          {filteredServices.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Campo de Pesquisa */}
      <div style={{ marginBottom: '20px' }}>
        <SearchInput value={searchTerm} onChange={setSearchTerm} placeholder="Buscar serviços..." />
      </div>

      {/* Árvore de Categorias */}
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          paddingRight: '8px',
        }}
      >
        <CategoryTree
          servicesByCategory={servicesByCategory}
          onServiceSelect={onServiceSelect}
          selectedServiceId={selectedServiceId}
        />
      </div>
    </aside>
  );
};

export default ServicesSidebar;

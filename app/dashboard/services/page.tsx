'use client';

import React from 'react';
import Header from '@/modules/admin/components/Header';
import DataTable from '@/modules/partner/components/DataTable';
import {
  usePartnerServices,
  type PartnerService,
} from '@/modules/partner/hooks/usePartnerServices';

const ServicesPage = () => {
  const { services, loading, error } = usePartnerServices();

  const columns: { key: keyof PartnerService | 'formatted_price'; header: string }[] = [
    { key: 'name', header: 'Nome' },
    { key: 'description', header: 'Descrição' },
    { key: 'formatted_price', header: 'Preço (R$)' },
    { key: 'category', header: 'Categoria' },
  ];

  // Formata os dados antes de passá-los para a tabela
  const formattedServices = services.map(service => ({
    ...service,
    formatted_price: new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(service.price),
  }));

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <Header />
      <div style={{ display: 'flex' }}>
        {/* Placeholder para o Menu Lateral */}
        <aside
          style={{
            width: '240px',
            background: '#fff',
            borderRight: '1px solid #e0e0e0',
            padding: '24px',
          }}
        >
          <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#333' }}>Menu</h2>
          {/* Links do menu virão aqui */}
        </aside>

        {/* Conteúdo Principal */}
        <main style={{ flex: 1, padding: '48px' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 600, marginBottom: 24, color: '#333' }}>
            Meus Serviços Cadastrados
          </h1>

          {loading && <p>Carregando serviços...</p>}
          {error && <p style={{ color: 'red' }}>Erro ao carregar serviços: {error}</p>}

          {!loading && !error && (
            <DataTable
              title="Serviços"
              data={formattedServices} // Usa os dados formatados
              columns={columns}
              emptyMessage="Nenhum serviço cadastrado."
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default ServicesPage;

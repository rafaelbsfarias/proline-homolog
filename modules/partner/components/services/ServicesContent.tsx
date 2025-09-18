'use client';

import React from 'react';
import DataTable from '@/modules/common/components/shared/DataTable';
import { formatCurrency } from '@/modules/common/utils/format';
import { PartnerService } from '@/modules/partner/hooks/usePartnerServices';

interface ServicesContentProps {
  services: PartnerService[];
  loading: boolean;
  error: string | null;
  onEdit: (service: PartnerService) => void;
  onDelete: (service: PartnerService) => Promise<void>;
}

const ServicesContent: React.FC<ServicesContentProps> = ({
  services,
  loading,
  error,
  onEdit,
  onDelete,
}) => {
  const columns: { key: keyof PartnerService | 'formatted_price'; header: string }[] = [
    { key: 'name', header: 'Nome' },
    { key: 'description', header: 'Descrição' },
    { key: 'formatted_price', header: 'Preço (R$)' },
    { key: 'category', header: 'Categoria' },
  ];

  // Formata os dados antes de passá-los para a tabela
  const formattedServices = services.map(service => ({
    ...service,
    formatted_price: formatCurrency(service.price),
  }));

  return (
    <>
      <h1 style={{ fontSize: '2rem', fontWeight: 600, marginBottom: 24, color: '#333' }}>
        Meus Serviços Cadastrados
      </h1>

      {loading && <p>Carregando serviços...</p>}
      {error && <p style={{ color: 'red' }}>Erro ao carregar serviços: {error}</p>}

      {!loading && !error && (
        <DataTable
          title="Serviços"
          data={formattedServices as PartnerService[]}
          columns={columns}
          emptyMessage="Nenhum serviço cadastrado."
          onEdit={onEdit}
          onDelete={onDelete}
          showActions={true}
          useConfirmDialog={false}
        />
      )}
    </>
  );
};

export default ServicesContent;

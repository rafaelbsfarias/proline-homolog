'use client';

import React, { useState } from 'react';
import { PartnerService } from '@/modules/partner/hooks/usePartnerServices';
import CategoryNode from './CategoryNode';

interface ServicesByCategory {
  categorized: Record<string, PartnerService[]>;
  uncategorized: PartnerService[];
}

interface CategoryTreeProps {
  servicesByCategory: ServicesByCategory;
  onServiceSelect?: (service: PartnerService) => void;
  selectedServiceId?: string;
}

const CategoryTree: React.FC<CategoryTreeProps> = ({
  servicesByCategory,
  onServiceSelect,
  selectedServiceId,
}) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const toggleCategory = (categoryName: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryName)) {
      newExpanded.delete(categoryName);
    } else {
      newExpanded.add(categoryName);
    }
    setExpandedCategories(newExpanded);
  };

  const { categorized, uncategorized } = servicesByCategory;

  return (
    <div>
      {/* Categorias organizadas */}
      {Object.entries(categorized).map(([categoryName, services]) => (
        <CategoryNode
          key={categoryName}
          categoryName={categoryName}
          services={services}
          isExpanded={expandedCategories.has(categoryName)}
          onToggle={() => toggleCategory(categoryName)}
          onServiceSelect={onServiceSelect}
          selectedServiceId={selectedServiceId}
        />
      ))}

      {/* Serviços sem categoria */}
      {uncategorized.length > 0 && (
        <CategoryNode
          categoryName="Sem Categoria"
          services={uncategorized}
          isExpanded={expandedCategories.has('Sem Categoria')}
          onToggle={() => toggleCategory('Sem Categoria')}
          onServiceSelect={onServiceSelect}
          selectedServiceId={selectedServiceId}
        />
      )}

      {/* Estado vazio */}
      {Object.keys(categorized).length === 0 && uncategorized.length === 0 && (
        <div
          style={{
            padding: '20px',
            textAlign: 'center',
            color: '#6b7280',
            fontSize: '14px',
          }}
        >
          Nenhum serviço encontrado
        </div>
      )}
    </div>
  );
};

export default CategoryTree;

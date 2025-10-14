import React from 'react';
import { SectionCard } from '../cards/SectionCard';
import styles from './PartnerEvidencesSection.module.css';

interface ChecklistCategory {
  category: string;
  partner_id: string;
  partner_name: string;
  has_anomalies: boolean;
}

interface PartnerEvidencesSectionProps {
  checklistCategories: ChecklistCategory[];
  categoriesLoading: boolean;
  loadingDynamicChecklist: boolean;
  onOpenDynamicChecklist: (args: {
    category: string;
    partnerId: string;
    partnerName?: string;
  }) => void;
}

export const PartnerEvidencesSection: React.FC<PartnerEvidencesSectionProps> = ({
  checklistCategories,
  categoriesLoading,
  loadingDynamicChecklist,
  onOpenDynamicChecklist,
}) => {
  // Mostrar botões somente quando houver checklist realmente realizado.
  const availableCategories = (checklistCategories || []).filter(c => c.has_anomalies);

  if (availableCategories.length === 0) return null;

  const headerAction = (
    <div className={styles.buttonGroup}>
      {/* Botões Checklist Dinâmico (Por Categoria) */}
      {categoriesLoading ? (
        <span className={styles.loadingText}>Carregando categorias...</span>
      ) : (
        availableCategories.map(cat => (
          <button
            key={`${cat.partner_id}-${cat.category}`}
            onClick={() =>
              onOpenDynamicChecklist({
                category: cat.category,
                partnerId: cat.partner_id,
                partnerName: cat.partner_name,
              })
            }
            disabled={loadingDynamicChecklist}
            className={styles.checklistButtonDynamic}
          >
            {loadingDynamicChecklist ? 'Carregando...' : `${cat.category} • ${cat.partner_name}`}
          </button>
        ))
      )}
    </div>
  );

  return (
    <SectionCard title="Vistorias" headerAction={headerAction} fullWidth>
      <p className={styles.infoMessage}>
        Clique nos botões acima para visualizar as vistorias realizadas pelos parceiros.
      </p>
    </SectionCard>
  );
};

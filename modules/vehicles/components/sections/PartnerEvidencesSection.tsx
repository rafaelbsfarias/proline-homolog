import React from 'react';
import { SectionCard } from '../cards/SectionCard';
import styles from './PartnerEvidencesSection.module.css';

interface PartnerChecklistCategory {
  category: string;
  partner_id: string;
  partner_name: string;
  has_anomalies: boolean;
}

interface PartnerEvidencesSectionProps {
  checklistCategories: PartnerChecklistCategory[];
  categoriesLoading: boolean;
  loadingDynamicChecklist: boolean;
  onOpenDynamicChecklist: (
    args: string | { category: string; partnerId: string; partnerName?: string }
  ) => Promise<void>;
}

export const PartnerEvidencesSection: React.FC<PartnerEvidencesSectionProps> = ({
  checklistCategories,
  categoriesLoading,
  loadingDynamicChecklist,
  onOpenDynamicChecklist,
}) => {
  if (categoriesLoading) {
    return (
      <SectionCard title="Vistorias" fullWidth>
        <div className={styles.loading}>Carregando vistorias...</div>
      </SectionCard>
    );
  }

  if (!checklistCategories || checklistCategories.length === 0) {
    return null;
  }

  const handleOpenChecklist = async (category: PartnerChecklistCategory) => {
    await onOpenDynamicChecklist({
      category: category.category,
      partnerId: category.partner_id,
      partnerName: category.partner_name,
    });
  };

  return (
    <>
      <SectionCard title="Vistorias" fullWidth>
        <div className={styles.checklistGrid}>
          {checklistCategories.map(category => (
            <button
              key={`${category.category}-${category.partner_id}`}
              onClick={() => handleOpenChecklist(category)}
              disabled={loadingDynamicChecklist}
              className={styles.checklistButton}
            >
              <div className={styles.checklistInfo}>
                <div className={styles.checklistTitle}>
                  {category.category} • {category.partner_name}
                </div>
                <div className={styles.checklistMeta}>
                  {category.has_anomalies ? 'Com anomalias' : 'Sem anomalias'}
                </div>
                <div className={styles.checklistStats}>
                  Status: {category.has_anomalies ? 'Revisar' : 'OK'}
                </div>
              </div>
            </button>
          ))}
        </div>
      </SectionCard>

      {/* O modal será aberto pelo VehicleDetails através do modalState.dynamicChecklistModal */}
    </>
  );
};

import React from 'react';
import { SectionCard } from '../cards/SectionCard';
import styles from './PartnerEvidencesSection.module.css';

interface PartnerChecklistEntry {
  id: string;
  category: string;
  partner_id: string;
  partner_name: string;
  type: 'mechanics_checklist' | 'vehicle_anomalies';
  has_anomalies: boolean;
  created_at: string;
  status: string;
}

interface PartnerEvidencesSectionProps {
  checklistCategories: PartnerChecklistEntry[];
  categoriesLoading: boolean;
  loadingDynamicChecklist: boolean;
  onOpenDynamicChecklist: (
    args:
      | string
      | { id: string; category: string; partnerId: string; partnerName?: string; type: string }
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

  const handleOpenChecklist = async (entry: PartnerChecklistEntry) => {
    await onOpenDynamicChecklist({
      id: entry.id,
      category: entry.category,
      partnerId: entry.partner_id,
      partnerName: entry.partner_name,
      type: entry.type,
    });
  };

  return (
    <>
      <SectionCard title="Vistorias" fullWidth>
        <div className={styles.checklistGrid}>
          {checklistCategories.map(entry => (
            <button
              key={`${entry.type}-${entry.id}`}
              onClick={() => handleOpenChecklist(entry)}
              disabled={loadingDynamicChecklist}
              className={styles.checklistButton}
            >
              <div className={styles.checklistInfo}>
                <div className={styles.checklistTitle}>
                  {entry.category} • {entry.partner_name}
                </div>
                <div className={styles.checklistMeta}>
                  {entry.type === 'vehicle_anomalies'
                    ? 'Relatório de Anomalias'
                    : 'Checklist Mecânico'}
                </div>
                <div className={styles.checklistStats}>
                  Status: {entry.status} • {new Date(entry.created_at).toLocaleDateString('pt-BR')}
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

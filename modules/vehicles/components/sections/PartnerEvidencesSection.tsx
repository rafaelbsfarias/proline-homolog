import React from 'react';
import { SectionCard } from '../cards/SectionCard';
import { MediaCard } from '../cards/MediaCard';
import styles from './PartnerEvidencesSection.module.css';

interface PartnerEvidence {
  item_key: string;
  label: string;
  url: string;
}

interface ChecklistCategory {
  category: string;
  partner_id: string;
  partner_name: string;
  has_anomalies: boolean;
}

interface PartnerEvidencesSectionProps {
  evidenceByCategory: Record<string, PartnerEvidence[]>;
  checklistCategories: ChecklistCategory[];
  checklistData: unknown;
  checklistLoading: boolean;
  categoriesLoading: boolean;
  loadingDynamicChecklist: boolean;
  onOpenStaticChecklist: () => void;
  onOpenDynamicChecklist: (category: string) => void;
}

export const PartnerEvidencesSection: React.FC<PartnerEvidencesSectionProps> = ({
  evidenceByCategory,
  checklistCategories,
  checklistData,
  checklistLoading,
  categoriesLoading,
  loadingDynamicChecklist,
  onOpenStaticChecklist,
  onOpenDynamicChecklist,
}) => {
  const hasAnyEvidence =
    checklistData || Object.keys(evidenceByCategory).length > 0 || checklistCategories.length > 0;

  if (!hasAnyEvidence) return null;

  const headerAction = (
    <div className={styles.buttonGroup}>
      {/* Botão Checklist Estático (Mecânica) */}
      {checklistLoading ? (
        <span className={styles.loadingText}>Carregando checklist...</span>
      ) : (
        checklistData && (
          <button onClick={onOpenStaticChecklist} className={styles.checklistButtonStatic}>
            Mecânica
          </button>
        )
      )}

      {/* Botões Checklist Dinâmico (Por Categoria) */}
      {categoriesLoading ? (
        <span className={styles.loadingText}>Carregando categorias...</span>
      ) : checklistCategories.length > 0 ? (
        checklistCategories.map(cat => (
          <button
            key={`${cat.partner_id}-${cat.category}`}
            onClick={() => onOpenDynamicChecklist(cat.category)}
            disabled={loadingDynamicChecklist}
            className={styles.checklistButtonDynamic}
          >
            {loadingDynamicChecklist ? 'Carregando...' : `Ver Checklist - ${cat.category}`}
          </button>
        ))
      ) : (
        <span className={styles.emptyText}>Nenhum checklist dinâmico disponível.</span>
      )}
    </div>
  );

  return (
    <SectionCard title="Evidências do Parceiro" headerAction={headerAction} fullWidth>
      {Object.keys(evidenceByCategory).length === 0 ? (
        <p className={styles.emptyMessage}>Nenhuma evidência enviada pelo parceiro.</p>
      ) : (
        Object.entries(evidenceByCategory).map(([category, items]) => (
          <div key={category} className={styles.categorySection}>
            <h3 className={styles.categoryTitle}>{category}</h3>
            <div className={styles.grid}>
              {items.map((ev, idx) => (
                <MediaCard
                  key={`${ev.item_key}-${idx}`}
                  src={ev.url}
                  alt={`Evidência Parceiro - ${ev.label}`}
                  date={new Date().toISOString()}
                  description={ev.label}
                />
              ))}
            </div>
          </div>
        ))
      )}
    </SectionCard>
  );
};

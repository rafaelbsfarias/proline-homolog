/**
 * Partner Header Component
 *
 * Displays partner basic information:
 * - Company name
 * - Partner ID
 * - Active status badge
 */

import React from 'react';
import type { Partner } from '../types';
import styles from './PartnerHeader.module.css';

interface PartnerHeaderProps {
  partner: Partner;
}

export const PartnerHeader: React.FC<PartnerHeaderProps> = ({ partner }) => {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>{partner.company_name}</h1>
      <div className={styles.partnerId}>Parceiro ID: {partner.id}</div>
      <div className={partner.is_active ? styles.statusActive : styles.statusInactive}>
        {partner.is_active ? 'Ativo' : 'Inativo'}
      </div>
    </div>
  );
};

/**
 * Partner Header Component
 *
 * Displays partner basic information:
 * - Company name
 * - Partner ID
 * - Active status badge
 * - Link to financial summary
 */

import React from 'react';
import Link from 'next/link';
import type { Partner } from '../types';
import styles from './PartnerHeader.module.css';

interface PartnerHeaderProps {
  partner: Partner;
}

export const PartnerHeader: React.FC<PartnerHeaderProps> = ({ partner }) => {
  return (
    <div className={styles.container}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h1 className={styles.title}>{partner.company_name}</h1>
          <div className={styles.partnerId}>Parceiro ID: {partner.id}</div>
          <div className={partner.is_active ? styles.statusActive : styles.statusInactive}>
            {partner.is_active ? 'Ativo' : 'Inativo'}
          </div>
        </div>

        <Link
          href={`/dashboard/partner/financial-summary?partnerId=${partner.id}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 16px',
            background: '#002E4C',
            color: '#fff',
            textDecoration: 'none',
            borderRadius: 6,
            fontSize: '0.875rem',
            fontWeight: 500,
            transition: 'background 0.2s',
            border: 'none',
            cursor: 'pointer',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = '#2980b9';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = '#002E4C';
          }}
        >
          <span>📊</span>
          <span>Resumo Financeiro</span>
        </Link>
      </div>
    </div>
  );
};

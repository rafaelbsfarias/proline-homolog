'use client';

import React from 'react';
import styles from './PartnersCard.module.css';
import containerStyles from './PartnersCardContainer.module.css';
import { supabase } from '@/modules/common/services/supabaseClient';

interface PartnerData {
  id: string;
  company_name: string;
  services_count: number;
  pending_budgets: number;
  executing_budgets: number;
  approval_budgets: number;
}

interface PartnersCardProps {
  onLoadingChange?: (loading: boolean) => void;
}

const PartnersCard: React.FC<PartnersCardProps> = ({ onLoadingChange }) => {
  const [partners, setPartners] = React.useState<PartnerData[]>([]);
  const [query, setQuery] = React.useState<string>('');
  const [filter, setFilter] = React.useState<'all' | 'pending' | 'executing' | 'approval'>('all');

  React.useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        onLoadingChange?.(true);
        const {
          data: { session },
        } = await supabase.auth.getSession();

        const resp = await fetch('/api/admin/partners/overview', {
          headers: {
            'Content-Type': 'application/json',
            ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
          },
        });
        if (!resp.ok) {
          // Fallback: mantém lista vazia
          setPartners([]);
          return;
        }
        const data = (await resp.json()) as { partners?: PartnerData[] };
        if (!isMounted) return;
        setPartners(Array.isArray(data.partners) ? data.partners : []);
      } catch {
        if (!isMounted) return;
        setPartners([]);
      } finally {
        onLoadingChange?.(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [onLoadingChange]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return partners.filter(p => {
      const matchName = !q || p.company_name.toLowerCase().includes(q);
      if (!matchName) return false;
      switch (filter) {
        case 'pending':
          return (p.pending_budgets || 0) + (p.approval_budgets || 0) > 0;
        case 'executing':
          return (p.executing_budgets || 0) > 0;
        case 'approval':
          return (p.approval_budgets || 0) > 0;
        case 'all':
        default:
          return true;
      }
    });
  }, [partners, query, filter]);

  // Ordenação: decrescente por 'para aprovação', depois 'em execução', depois 'pendentes'
  const sorted = React.useMemo(() => {
    const arr = filtered.slice();
    arr.sort((a, b) => {
      const byApproval = (b.approval_budgets || 0) - (a.approval_budgets || 0);
      if (byApproval !== 0) return byApproval;
      const byExecuting = (b.executing_budgets || 0) - (a.executing_budgets || 0);
      if (byExecuting !== 0) return byExecuting;
      const byPending = (b.pending_budgets || 0) - (a.pending_budgets || 0);
      if (byPending !== 0) return byPending;
      // fallback determinístico por nome
      return a.company_name.localeCompare(b.company_name);
    });
    return arr;
  }, [filtered]);

  return (
    <div className={containerStyles.partnersCardOuter}>
      <div className={styles.partnersCard}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>Parceiros</h3>
          <div className={styles.totalPartners}>{filtered.length} parceiros</div>
        </div>

        {/* Filtros */}
        <div style={{ display: 'flex', gap: 12, padding: '8px 0 12px 0', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Buscar empresa..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{
              flex: 1,
              maxWidth: 360,
              border: '1px solid #e3e3e3',
              borderRadius: 6,
              padding: '8px 10px',
            }}
          />
          <select
            value={filter}
            onChange={e => setFilter(e.target.value as typeof filter)}
            style={{
              border: '1px solid #e3e3e3',
              borderRadius: 6,
              padding: '8px 10px',
              background: 'white',
            }}
          >
            <option value="all">Todos</option>
            <option value="pending">Com pendências</option>
            <option value="executing">Em execução</option>
            <option value="approval">Para aprovação</option>
          </select>
        </div>

        <div className={styles.tableContainer}>
          <table className={styles.partnersTable}>
            <thead>
              <tr>
                <th className={styles.companyColumn}>Empresa Parceira</th>
                <th className={styles.servicesColumn}>Serviços Cadastrados</th>
                <th className={styles.budgetColumn}>Orçamentos Pendentes</th>
                <th className={styles.budgetColumn}>Em Execução</th>
                <th className={styles.budgetColumn}>Para Aprovação</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(partner => (
                <tr key={partner.id} className={styles.tableRow}>
                  <td className={styles.companyCell}>
                    <a
                      className={styles.companyName}
                      href={`/dashboard/admin/partner-overview?partnerId=${partner.id}`}
                    >
                      {partner.company_name}
                    </a>
                  </td>
                  <td className={styles.servicesCell}>
                    <span className={styles.servicesCount}>{partner.services_count}</span>
                  </td>
                  <td className={styles.budgetCell}>
                    <span className={`${styles.budgetBadge} ${styles.pending}`}>
                      {partner.pending_budgets}
                    </span>
                  </td>
                  <td className={styles.budgetCell}>
                    <span className={`${styles.budgetBadge} ${styles.executing}`}>
                      {partner.executing_budgets}
                    </span>
                  </td>
                  <td className={styles.budgetCell}>
                    <span className={`${styles.budgetBadge} ${styles.approval}`}>
                      {partner.approval_budgets}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className={styles.cardFooter}>
          <div className={styles.summaryStats}>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Total Serviços:</span>
              <span className={styles.statValue}>
                {partners.reduce((sum, p) => sum + p.services_count, 0)}
              </span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Orçamentos Ativos:</span>
              <span className={styles.statValue}>
                {partners.reduce((sum, p) => sum + p.executing_budgets, 0)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PartnersCard;

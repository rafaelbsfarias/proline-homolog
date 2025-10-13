/**
 * Services Table Component
 *
 * Displays services in a table format with:
 * - Search filter (by name)
 * - Status filter (active/inactive/all)
 * - Toggle active status button
 */

import React from 'react';
import type { Service, ServiceFilterStatus } from '../types';
import styles from './ServicesTable.module.css';

interface ServicesTableProps {
  services: Service[];
  query: string;
  status: ServiceFilterStatus;
  onQueryChange: (query: string) => void;
  onStatusChange: (status: ServiceFilterStatus) => void;
  onToggle: (serviceId: string, isActive: boolean) => void;
}

const STATUS_LABELS: Record<ServiceFilterStatus, string> = {
  all: 'Todos',
  active: 'Ativos',
  inactive: 'Inativos',
};

export const ServicesTable: React.FC<ServicesTableProps> = ({
  services,
  query,
  status,
  onQueryChange,
  onStatusChange,
  onToggle,
}) => {
  return (
    <div className={styles.section}>
      <h2 className={styles.sectionTitle}>Serviços</h2>

      <div className={styles.filters}>
        <input
          type="text"
          placeholder="Buscar por nome..."
          value={query}
          onChange={e => onQueryChange(e.target.value)}
          className={styles.searchInput}
        />

        <select
          value={status}
          onChange={e => onStatusChange(e.target.value as ServiceFilterStatus)}
          className={styles.statusSelect}
        >
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {services.length === 0 ? (
        <div className={styles.emptyState}>Nenhum serviço encontrado.</div>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Descrição</th>
                <th>Preço</th>
                <th>Status</th>
                <th>Cadastrado em</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {services.map(service => (
                <tr key={service.id}>
                  <td className={styles.cellName}>{service.name}</td>
                  <td className={styles.cellDescription}>
                    {service.description || <span className={styles.textMuted}>Sem descrição</span>}
                  </td>
                  <td>
                    {service.price != null
                      ? `R$ ${Number(service.price).toLocaleString('pt-BR', {
                          minimumFractionDigits: 2,
                        })}`
                      : '—'}
                  </td>
                  <td>
                    <span
                      className={`${styles.statusBadge} ${
                        service.is_active ? styles.statusActive : styles.statusInactive
                      }`}
                    >
                      {service.is_active ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td>{new Date(service.created_at).toLocaleDateString('pt-BR')}</td>
                  <td>
                    <button
                      onClick={() => onToggle(service.id, !service.is_active)}
                      className={`${styles.btn} ${
                        service.is_active ? styles.btnDanger : styles.btnSuccess
                      }`}
                      title={service.is_active ? 'Desativar serviço' : 'Ativar serviço'}
                    >
                      {service.is_active ? 'Desativar' : 'Ativar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

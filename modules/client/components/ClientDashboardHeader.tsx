import React from 'react';
import styles from './ClientDashboardHeader.module.css';

interface ClientDashboardHeaderProps {
  userName: string;
  onRefresh: () => void;
  loading: boolean;
}

export const ClientDashboardHeader: React.FC<ClientDashboardHeaderProps> = ({
  userName,
  onRefresh,
  loading
}) => {
  return (
    <header className={styles.header}>
      <div className={styles.headerContent}>
        <h1 className={styles.dashboardTitle}>Painel do Cliente</h1>
        <p className={styles.dashboardWelcome}>Bem-vindo, {userName}!</p>
        <div className={styles.headerActions}>
          <button
            onClick={onRefresh}
            className={styles.refreshButton}
            disabled={loading}
            aria-label="Atualizar dashboard"
          >
            🔄 Atualizar
          </button>
        </div>
      </div>
    </header>
  );
};
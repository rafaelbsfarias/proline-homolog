import React from 'react';
import styles from './WelcomeSection.module.css';

interface WelcomeSectionProps {
  userName?: string;
  isLoading?: boolean;
}

/**
 * WelcomeSection Component
 *
 * Exibe mensagem de boas-vindas com nome do usuário.
 * Tipografia responsiva que se adapta a diferentes tamanhos de tela.
 */
export const WelcomeSection: React.FC<WelcomeSectionProps> = ({ userName, isLoading = false }) => {
  if (isLoading) {
    return null;
  }

  return (
    <div className={styles.welcomeContainer}>
      <h1 className={styles.welcomeText}>
        Bem-vindo, <span className={styles.userName}>{userName || ''}</span>
      </h1>
    </div>
  );
};

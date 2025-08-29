/**
 * Componente para cabeçalho da página de login
 * Implementa Single Responsibility Principle
 * Responsabilidade única: exibir logo e informações de boas-vindas
 */

import React from 'react';
import styles from '../components/Login/LoginPage.module.css';

interface LoginHeaderProps {
  logoSrc?: string;
  logoAlt?: string;
  title?: string;
  subtitle?: string;
}

export const LoginHeader: React.FC<LoginHeaderProps> = ({
  logoSrc = '/assets/images/logo-proline.png',
  logoAlt = 'Proline Auto Logo',
  title = 'Bem-vindo',
  subtitle = 'Acesse sua conta para continuar',
}) => {
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>): void => {
    // fallback for image error
    const target = e.target as HTMLImageElement;
    target.style.display = 'none';

    const fallback = document.createElement('div');
    fallback.textContent = 'ProLine';
    fallback.style.fontSize = '2rem';
    fallback.style.fontWeight = 'bold';
    fallback.style.marginBottom = '1rem';

    target.parentElement?.insertBefore(fallback, target.nextSibling);
  };

  return (
    <>
      <img src={logoSrc} alt={logoAlt} className={styles.logo} onError={handleImageError} />
      <h2 className={styles.loginTitle}>{title}</h2>
      <span className={styles.loginSubtitle}>{subtitle}</span>
    </>
  );
};

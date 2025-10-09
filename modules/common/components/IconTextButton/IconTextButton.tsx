import React, { ButtonHTMLAttributes } from 'react';
import styles from './IconTextButton.module.css';

interface IconTextButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

export const IconTextButton: React.FC<IconTextButtonProps> = ({
  children,
  className,
  icon,
  iconPosition = 'left',
  ...props
}) => {
  return (
    <button className={`${styles.iconOutlineButton} ${className || ''}`} {...props}>
      {iconPosition === 'left' && <span className={styles.icon}>{icon}</span>}
      {children}
      {iconPosition === 'right' && <span className={styles.icon}>{icon}</span>}
    </button>
  );
};

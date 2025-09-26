import React, { ButtonHTMLAttributes } from 'react';
import styles from './IconButton.module.css';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  title?: string;
  ariaLabel?: string;
}

const IconButton: React.FC<IconButtonProps> = ({ icon, title, ariaLabel, className, ...props }) => {
  return (
    <button
      className={`${styles.iconButton} ${className || ''}`}
      title={title}
      aria-label={ariaLabel}
      {...props}
    >
      {icon}
    </button>
  );
};

export default IconButton;

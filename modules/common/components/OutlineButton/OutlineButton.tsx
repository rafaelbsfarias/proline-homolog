import React, { ButtonHTMLAttributes } from 'react';
import style from './OutlineButton.module.css';

interface OutlineButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {}

export const OutlineButton: React.FC<OutlineButtonProps> = ({ children, className, ...props }) => {
  return (
    <button className={`${style.outlineButton} ${className || ''}`} {...props}>
      {children}
    </button>
  );
};

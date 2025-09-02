import React, { ButtonHTMLAttributes } from 'react';
import style from './SolidButton.module.css';

interface SolidButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {}

export const SolidButton: React.FC<SolidButtonProps> = ({ children, ...props }) => {
  return (
    <button className={style.solidButton} {...props}>
      {children}
    </button>
  );
};

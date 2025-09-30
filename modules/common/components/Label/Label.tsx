import React from 'react';
import styles from './Label.module.css';

interface LabelProps {
  htmlFor: string;
  children: React.ReactNode;
  className?: string;
}

const Label: React.FC<LabelProps> = ({ htmlFor, children, className }) => {
  return (
    <label htmlFor={htmlFor} className={`${styles.label} ${className || ''}`}>
      {children}
    </label>
  );
};

export default Label;

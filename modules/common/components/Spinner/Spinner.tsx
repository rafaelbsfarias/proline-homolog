import React from 'react';
import styles from './Spinner.module.css';

interface SpinnerProps {
  size?: number; // tamanho em px
}

const Spinner: React.FC<SpinnerProps> = ({ size = 50 }) => {
  return (
    <div
      className={styles.spinner}
      style={{ width: size, height: size, borderTopColor: '#002e4c' }}
      aria-label="Loading..."
    />
  );
};

export default Spinner;

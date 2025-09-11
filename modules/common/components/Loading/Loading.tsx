// Loading.tsx
'use client';

import { BlinkBlur } from 'react-loading-indicators';
import styles from './Loading.module.css';

interface LoadingProps {
  /** altura mínima do container, ex: '60vh', '100vh' */
  minHeight?: string;
  /** controla se ocupa toda a tela */
  fullScreen?: boolean;
}

export const Loading: React.FC<LoadingProps> = ({ minHeight = '100vh', fullScreen = false }) => {
  return (
    <div
      className={styles.loadingPage}
      style={{
        minHeight: fullScreen ? '100vh' : minHeight,
      }}
    >
      <div className={styles.loadingContent}>
        <BlinkBlur color="#002e4c" size="large" text="" textColor="" />
      </div>
    </div>
  );
};

import React from 'react';
import { Loading } from '@/modules/common/components/Loading/Loading';
import styles from './LoadingState.module.css';

export const LoadingState: React.FC = () => {
  return (
    <div className={styles.container}>
      <Loading />
    </div>
  );
};

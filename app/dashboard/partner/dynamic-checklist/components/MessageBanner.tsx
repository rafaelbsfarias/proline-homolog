import React from 'react';
import styles from './MessageBanner.module.css';

interface MessageBannerProps {
  type: 'error' | 'success';
  message: string;
}

export const MessageBanner: React.FC<MessageBannerProps> = ({ type, message }) => {
  return <div className={`${styles.banner} ${styles[type]}`}>{message}</div>;
};

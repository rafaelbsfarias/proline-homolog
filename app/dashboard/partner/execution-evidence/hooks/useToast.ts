import { useState } from 'react';
import { ToastState } from '../types';

const INITIAL_TOAST: ToastState = {
  show: false,
  message: '',
  type: 'success',
};

export const useToast = () => {
  const [toast, setToast] = useState<ToastState>(INITIAL_TOAST);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast(INITIAL_TOAST);
    }, 4000);
  };

  const hideToast = () => {
    setToast(INITIAL_TOAST);
  };

  return { toast, showToast, hideToast };
};

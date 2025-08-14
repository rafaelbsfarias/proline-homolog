'use client';

import { AuthProvider } from '@/modules/common/services/AuthProvider';
import { ToastProvider } from '@/modules/common/components/ToastProvider';

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <AuthProvider>
      <ToastProvider>{children}</ToastProvider>
    </AuthProvider>
  );
}

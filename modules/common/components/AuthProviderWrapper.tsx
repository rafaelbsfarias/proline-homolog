'use client';

import { useEffect, useState } from 'react';
import { AuthProvider } from '@/modules/common/services/AuthProvider';
import { ToastProvider } from '@/modules/common/components/ToastProvider';

interface AuthProviderWrapperProps {
  children: React.ReactNode;
}

export function AuthProviderWrapper({ children }: AuthProviderWrapperProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Renderizar loading até estar completamente montado
  if (!mounted) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          backgroundColor: '#f8f9fa',
        }}
      >
        <div
          style={{
            padding: '20px',
            textAlign: 'center',
            color: '#6b7280',
          }}
        >
          <div>Carregando...</div>
        </div>
      </div>
    );
  }

  // Após estar montado, renderizar a aplicação completa
  return (
    <AuthProvider>
      <ToastProvider>{children}</ToastProvider>
    </AuthProvider>
  );
}

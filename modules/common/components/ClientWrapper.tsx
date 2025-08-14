'use client';

import { AuthProvider } from '@/modules/common/services/AuthProvider';
import { ToastProvider } from '@/modules/common/components/ToastProvider';
import { useEffect, useState, Suspense } from 'react';

interface ClientWrapperProps {
  children: React.ReactNode;
}

const LoadingScreen = () => (
  <div
    style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#ffffff',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      color: '#374151',
      zIndex: 9999,
    }}
  >
    <div style={{ textAlign: 'center' }}>
      <div
        style={{
          width: '32px',
          height: '32px',
          border: '3px solid #e5e7eb',
          borderTop: '3px solid #3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 12px',
        }}
      />
      <div>Carregando ProLine...</div>
      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    </div>
  </div>
);

export function ClientWrapper({ children }: ClientWrapperProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return <LoadingScreen />;
  }

  return (
    <Suspense fallback={<LoadingScreen />}>
      <AuthProvider>
        <ToastProvider>
          <Suspense fallback={<LoadingScreen />}>{children}</Suspense>
        </ToastProvider>
      </AuthProvider>
    </Suspense>
  );
}

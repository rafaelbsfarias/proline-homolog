'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../../services/AuthProvider';
import React, { useEffect } from 'react';
import { Loading } from '../Loading/Loading';

interface Props {
  children: React.ReactNode;
}

const PUBLIC_PATHS = [
  '/login',
  '/cadastro',
  '/recuperar-senha',
  '/confirm-email',
  '/auth/callback',
];

export const RouteProtector: React.FC<Props> = ({ children }) => {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const isPublic = pathname === '/' || PUBLIC_PATHS.some(path => pathname.startsWith(path));

  useEffect(() => {
    if (!loading && !isPublic && !user) {
      router.push('/login');
    }
  }, [loading, isPublic, user, router]);

  if (loading) {
    return <Loading />;
  }

  if (!isPublic && !user) {
    return null;
  }

  return <>{children}</>;
};

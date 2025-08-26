'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../../services/AuthProvider';
import React from 'react';
import { Loading } from '../Loading/Loading';

interface Props {
  children: React.ReactNode;
}

const PUBLIC_PATHS = ['/login', '/cadastro', '/recuperar-senha', '/confirm-email'];

export const RouteProtector: React.FC<Props> = ({ children }) => {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const isPublic = PUBLIC_PATHS.some(path => pathname.startsWith(path));

  if (loading) {
    return <Loading />;
  }

  if (!isPublic && !user) {
    router.push('/login');
    return null;
  }

  return <>{children}</>;
};

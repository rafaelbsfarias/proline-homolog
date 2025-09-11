'use client';

import dynamic from 'next/dynamic';

const DynamicLoginPageContainer = dynamic(
  () =>
    import('@/modules/common/components/Login/LoginPageContainer').then(
      mod => mod.LoginPageContainer
    ),
  { ssr: false }
);

/**
 * Página de login principal
 * Utiliza o container de login com todos os estilos e funcionalidades
 */
export default function LoginPage() {
  return <DynamicLoginPageContainer />;
}

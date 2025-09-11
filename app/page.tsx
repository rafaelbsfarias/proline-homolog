'use client';

import React from 'react';
import { AuthProvider } from '../modules/common/services/AuthProvider';
import { LoginPageContainer } from '@/modules/common/components/Login/LoginPageContainer';
import { setupDIContainer } from './di/setup';

// Inicializa o container de DI
setupDIContainer();

/**
 * Página principal - Mostra a tela de login
 * Responsabilidade única: renderizar a estrutura da aplicação
 */
const App: React.FC = () => {
  return (
    <AuthProvider>
      <LoginPageContainer />
    </AuthProvider>
  );
};

export default App;

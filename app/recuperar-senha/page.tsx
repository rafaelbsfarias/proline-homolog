import React from 'react';
import ForgotPasswordPage from '../../modules/common/components/ForgotPasswordPage';
import { AuthProvider } from '../../modules/common/services/AuthProvider';

export default function RecuperarSenhaRoute() {
  return (
    <AuthProvider>
      <ForgotPasswordPage />
    </AuthProvider>
  );
}

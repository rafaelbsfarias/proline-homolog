import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/modules/common/services/AuthProvider';
import { AUTH_MESSAGES } from '@/modules/common/constants/messages';

export function useAuthentication() {
  const router = useRouter();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  async function doLogin(email: string, password: string) {
    setIsLoading(true);
    setError('');
    const result = await login(email, password);
    setIsLoading(false);

    if (result.success) {
      router.push('/dashboard');
      return { success: true };
    } else {
      const msg = result.error || AUTH_MESSAGES.LOGIN_ERROR;
      setError(msg);
      return { success: false, error: msg };
    }
  }

  return { login: doLogin, isLoading, error, setError };
}

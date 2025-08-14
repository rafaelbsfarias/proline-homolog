'use client';
import React, { useState } from 'react';
import styles from './ForgotPasswordPage.module.css';
import { useAuth } from '@/modules/common/services/AuthProvider';
import { useRouter } from 'next/navigation';

interface FormState {
  email: string;
  isLoading: boolean;
  message: string;
  error: string;
}

// Single Responsibility: Validação de email
class EmailValidator {
  private static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  static validate(email: string): { isValid: boolean; error?: string } {
    const sanitizedEmail = email.trim();

    if (!sanitizedEmail) {
      return { isValid: false, error: 'Email é obrigatório.' };
    }

    if (!this.EMAIL_REGEX.test(sanitizedEmail)) {
      return { isValid: false, error: 'Email inválido.' };
    }

    return { isValid: true };
  }
}

// Single Responsibility: Gerenciamento de estado do formulário
class FormStateManager {
  static getInitialState(): FormState {
    return {
      email: '',
      isLoading: false,
      message: '',
      error: '',
    };
  }

  static setLoading(state: FormState): FormState {
    return {
      ...state,
      isLoading: true,
      error: '',
      message: '',
    };
  }

  static setSuccess(state: FormState, message: string): FormState {
    return {
      ...state,
      isLoading: false,
      message,
      error: '',
      email: '',
    };
  }

  static setError(state: FormState, error: string): FormState {
    return {
      ...state,
      isLoading: false,
      error,
      message: '',
    };
  }
}

const ForgotPasswordPage: React.FC = () => {
  const [formState, setFormState] = useState<FormState>(FormStateManager.getInitialState());
  const router = useRouter();
  const auth = useAuth();

  // Single Responsibility: Manipulação de submissão do formulário
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validation = EmailValidator.validate(formState.email);
    if (!validation.isValid) {
      setFormState(prev => FormStateManager.setError(prev, validation.error!));
      return;
    }

    setFormState(prev => FormStateManager.setLoading(prev));

    try {
      const result = await auth.resetPassword(formState.email.trim());

      if (result.success) {
        setFormState(prev =>
          FormStateManager.setSuccess(
            prev,
            'Email enviado com sucesso! Verifique sua caixa de entrada.'
          )
        );
      } else {
        setFormState(prev =>
          FormStateManager.setError(
            prev,
            result.error || 'Erro ao enviar email de recuperação. Tente novamente.'
          )
        );
      }
    } catch (error) {
      setFormState(prev =>
        FormStateManager.setError(prev, 'Erro ao enviar email de recuperação. Tente novamente.')
      );
    }
  };

  // Single Responsibility: Navegação de volta ao login
  const handleBackToLogin = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    router.push('/');
  };

  // Single Responsibility: Atualização do email
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormState(prev => ({ ...prev, email: e.target.value }));
  };

  return (
    <div className={styles.forgotPasswordContainer}>
      <div className={styles.formCard}>
        <img src="/assets/images/logo-proline.png" alt="ProLine Logo" className={styles.logo} />

        <h1 className={styles.title}>Esqueci minha senha</h1>

        <p className={styles.subtitle}>
          Digite seu email e enviaremos um link para redefinir sua senha
        </p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="email" className={styles.label}>
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="Digite seu email"
              value={formState.email}
              onChange={handleEmailChange}
              className={`${styles.input} ${formState.error ? styles.inputError : ''}`}
              required
              disabled={formState.isLoading}
            />
          </div>

          {formState.error && <div className={styles.errorMessage}>{formState.error}</div>}

          {formState.message && <div className={styles.successMessage}>{formState.message}</div>}

          <button type="submit" className={styles.submitButton} disabled={formState.isLoading}>
            {formState.isLoading ? 'Enviando...' : 'Enviar link de recuperação'}
          </button>

          <div className={styles.backToLogin}>
            <a href="#" onClick={handleBackToLogin} className={styles.backLink}>
              Voltar ao login
            </a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;

'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { useSignupForm } from '../../hooks/Signup/useSignupForm';

import styles from './SignupPage.module.css';
import ErrorMessage from '../ErroMessage/ErrorMessage';
import Input from '../Input/Input';
import Modal from '../Modal/Modal';

const SignupPage: React.FC = () => {
  const router = useRouter();
  const {
    form,
    isLoading,
    fieldErrors,
    globalError,
    success,
    handleChange,
    handleSubmit,
    setGlobalError,
    setSuccess,
  } = useSignupForm();

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleSubmit();
  };

  return (
    <div className={styles.signupContainer}>
      {/* Modal de Erro */}
      <Modal isOpen={!!globalError} onClose={() => setGlobalError(null)}>
        <h3 style={{ marginBottom: 18, color: '#e53935' }}>Erro ao cadastrar</h3>
        <div style={{ color: '#222', fontSize: '1.08rem', marginBottom: 24 }}>{globalError}</div>
        <button
          className={styles.submitButton}
          style={{ width: 280, margin: '0 auto', display: 'block' }}
          onClick={() => setGlobalError(null)}
        >
          OK
        </button>
      </Modal>

      {/* Modal de Sucesso */}
      <Modal isOpen={success} onClose={() => setSuccess(false)}>
        <h3 style={{ marginBottom: 18 }}>Cadastro realizado com sucesso!</h3>
        <div style={{ color: '#222', fontSize: '1.08rem', marginBottom: 24 }}>
          Sua solicitação será analisada e aprovada pela equipe ProLine.
        </div>
        <button
          className={styles.submitButton}
          style={{ width: 180, margin: '0 auto', display: 'block' }}
          onClick={() => router.push('/login')}
        >
          OK
        </button>
      </Modal>

      <div
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}
      >
        <img
          src="/assets/images/logo-proline.png"
          alt="ProLine"
          style={{ maxWidth: 200, height: 'auto', marginBottom: 18, cursor: 'pointer' }}
          onClick={() => router.push('/')}
        />
        <h2 style={{ marginTop: 18, color: '#222', fontWeight: 600, fontSize: '1.35rem' }}>
          Seja bem-vindo ao HUB ProLine!
        </h2>
      </div>

      <form onSubmit={handleFormSubmit}>
        <div className={styles.inputGroup}>
          <Input
            id="fullName"
            name="fullName"
            label="Nome completo"
            value={form.fullName}
            onChange={handleChange}
            disabled={isLoading}
            className={fieldErrors.fullName ? styles.error : ''}
          />
          <ErrorMessage message={fieldErrors.fullName} />
        </div>
        <div className={styles.inputGroup}>
          <Input
            id="companyName"
            name="companyName"
            label="Razão Social"
            value={form.companyName}
            onChange={handleChange}
            disabled={isLoading}
            className={fieldErrors.companyName ? styles.error : ''}
          />
          <ErrorMessage message={fieldErrors.companyName} />
        </div>
        <div className={styles.inputGroup}>
          <Input
            id="cnpj"
            name="cnpj"
            label="CNPJ"
            value={form.cnpj}
            onChange={handleChange}
            disabled={isLoading}
            mask="00.000.000/0000-00"
            className={fieldErrors.cnpj ? styles.error : ''}
          />
          <ErrorMessage message={fieldErrors.cnpj} />
        </div>
        <div className={styles.inputGroup}>
          <Input
            id="email"
            name="email"
            label="Email"
            type="email"
            value={form.email}
            onChange={handleChange}
            disabled={isLoading}
            className={fieldErrors.email ? styles.error : ''}
          />
          <ErrorMessage message={fieldErrors.email} />
        </div>
        <div className={styles.inputGroup}>
          <Input
            id="phone"
            name="phone"
            label="Telefone"
            type="tel"
            value={form.phone}
            onChange={handleChange}
            disabled={isLoading}
            mask="(00) 00000-0000"
            className={fieldErrors.phone ? styles.error : ''}
          />
          <ErrorMessage message={fieldErrors.phone} />
        </div>
        <div className={styles.inputGroup}>
          <Input
            id="password"
            name="password"
            label="Senha"
            type="password"
            value={form.password}
            onChange={handleChange}
            disabled={isLoading}
            className={fieldErrors.password ? styles.error : ''}
          />
          <ErrorMessage message={fieldErrors.password} />
        </div>
        <div className={styles.inputGroup}>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            label="Confirme a senha"
            type="password"
            value={form.confirmPassword}
            onChange={handleChange}
            disabled={isLoading}
            className={fieldErrors.confirmPassword ? styles.error : ''}
          />
          <ErrorMessage message={fieldErrors.confirmPassword} />
        </div>

        <button type="submit" className={styles.submitButton} disabled={isLoading || success}>
          {isLoading ? 'Cadastrando...' : 'Cadastrar'}
        </button>
      </form>
    </div>
  );
};

export default SignupPage;

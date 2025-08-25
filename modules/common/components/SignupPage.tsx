'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSignupForm } from '../hooks/Signup/useSignupForm';
import { EyeIcon } from './EyeIcon';
import Modal from './Modal';
import styles from './SignupPage.module.css';

const SignupPage: React.FC = () => {
  const router = useRouter();
  const { form, isLoading, error, success, handleChange, handleSubmit, setError, setSuccess } =
    useSignupForm();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleSubmit();
  };

  return (
    <div className={styles.signupContainer}>
      {/* Modal de Erro */}
      <Modal isOpen={!!error} onClose={() => setError(null)}>
        <h3 style={{ marginBottom: 18, color: '#e53935' }}>Erro ao cadastrar</h3>
        <div style={{ color: '#222', fontSize: '1.08rem', marginBottom: 24 }}>{error}</div>
        <button
          className={styles.submitButton}
          style={{ width: 280, margin: '0 auto', display: 'block' }}
          onClick={() => setError(null)}
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
          <label htmlFor="fullName">Nome completo</label>
          <input
            type="text"
            id="fullName"
            name="fullName"
            value={form.fullName}
            onChange={handleChange}
            required
            disabled={isLoading}
          />
        </div>
        <div className={styles.inputGroup}>
          <label htmlFor="companyName">Razão Social</label>
          <input
            type="text"
            id="companyName"
            name="companyName"
            value={form.companyName}
            onChange={handleChange}
            required
            disabled={isLoading}
          />
        </div>
        <div className={styles.inputGroup}>
          <label htmlFor="cnpj">CNPJ</label>
          <input
            type="text"
            id="cnpj"
            name="cnpj"
            value={form.cnpj}
            onChange={handleChange}
            required
            disabled={isLoading}
          />
        </div>
        <div className={styles.inputGroup}>
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
            disabled={isLoading}
          />
        </div>
        <div className={styles.inputGroup}>
          <label htmlFor="phone">Telefone</label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            required
            disabled={isLoading}
          />
        </div>
        <div className={styles.inputGroup} style={{ position: 'relative' }}>
          <label htmlFor="password">Senha</label>
          <input
            type={showPassword ? 'text' : 'password'}
            id="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            required
            disabled={isLoading}
          />
          <button
            type="button"
            tabIndex={-1}
            aria-label={showPassword ? 'Ocultar senha' : 'Exibir senha'}
            onClick={() => setShowPassword(v => !v)}
            style={{
              position: 'absolute',
              right: 12,
              top: 38,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <EyeIcon open={showPassword} />
          </button>
        </div>
        <div className={styles.inputGroup} style={{ position: 'relative' }}>
          <label htmlFor="confirmPassword">Confirme a senha</label>
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            id="confirmPassword"
            name="confirmPassword"
            value={form.confirmPassword}
            onChange={handleChange}
            required
            disabled={isLoading}
          />
          <button
            type="button"
            tabIndex={-1}
            aria-label={showConfirmPassword ? 'Ocultar senha' : 'Exibir senha'}
            onClick={() => setShowConfirmPassword(v => !v)}
            style={{
              position: 'absolute',
              right: 12,
              top: 38,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <EyeIcon open={showConfirmPassword} />
          </button>
        </div>

        <button type="submit" className={styles.submitButton} disabled={isLoading || success}>
          {isLoading ? 'Cadastrando...' : 'Cadastrar'}
        </button>
      </form>
    </div>
  );
};

export default SignupPage;

'use client';
import React, { useState } from 'react';
import { EyeIcon } from './EyeIcon';
import styles from './SignupPage.module.css';
import { useSignupForm } from '../hooks/useSignupForm';
import {
  validateFullName,
  validateEmail,
  validatePassword,
  validateCompanyName,
  validateCNPJ,
  validatePhone,
} from '../validators/signupValidators';
// import { useAuthService } from '../services/AuthProvider';

import { useRouter } from 'next/navigation';
import Modal from './Modal';
const SignupPage: React.FC = () => {
  const { form, isLoading, setIsLoading, handleChange } = useSignupForm();
  const [error, setError] = useState('');
  const [showErrorModal, setShowErrorModal] = useState(false);
  // success state removed
  const [passwordMatch, setPasswordMatch] = useState<null | boolean>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [touched, setTouched] = useState<{ [k: string]: boolean }>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const router = useRouter();

  function handleBlur(e: React.FocusEvent<HTMLInputElement>) {
    setTouched(prev => ({ ...prev, [e.target.name]: true }));
    if (e.target.name === 'confirmPassword' || e.target.name === 'password') {
      if (!form.password && !form.confirmPassword) {
        setPasswordMatch(null);
      } else if (form.password && form.confirmPassword) {
        setPasswordMatch(form.password === form.confirmPassword);
      } else {
        setPasswordMatch(null);
      }
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    // Validação simples
    const requiredFields = [
      { name: 'fullName', label: 'Nome completo' },
      { name: 'companyName', label: 'Razão Social' },
      { name: 'cnpj', label: 'CNPJ' },
      { name: 'email', label: 'Email' },
      { name: 'phone', label: 'Telefone' },
      { name: 'password', label: 'Senha' },
      { name: 'confirmPassword', label: 'Confirme a senha' },
    ];
    const missing = requiredFields.filter(f => !form[f.name as keyof typeof form]);
    if (missing.length > 0) {
      setError('Preencha todos os campos obrigatórios: ' + missing.map(f => f.label).join(', '));
      setTouched(prev => ({
        ...prev,
        ...Object.fromEntries(missing.map(f => [f.name, true])),
      }));
      setShowErrorModal(true);
      setIsLoading(false);
      return;
    }
    const fieldValidators = [
      { fn: validateFullName, value: form.fullName },
      { fn: validateCompanyName, value: form.companyName },
      { fn: validateCNPJ, value: form.cnpj },
      { fn: validateEmail, value: form.email },
      { fn: validatePhone, value: form.phone },
      { fn: validatePassword, value: form.password },
    ];
    for (const v of fieldValidators) {
      const result = v.fn(v.value);
      if (result) {
        setError(result);
        setShowErrorModal(true);
        setIsLoading(false);
        return;
      }
    }
    if (form.password !== form.confirmPassword) {
      setError('As senhas não coincidem.');
      setPasswordMatch(false);
      setTouched(prev => ({ ...prev, password: true, confirmPassword: true }));
      setShowErrorModal(true);
      setIsLoading(false);
      return;
    } else {
      setPasswordMatch(true);
    }
    // Envia para a API de pending_registrations
    try {
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Erro ao cadastrar.');
        setShowErrorModal(true);
      } else {
        setShowSuccessModal(true);
      }
    } catch {
      setError('Erro ao cadastrar.');
      setShowErrorModal(true);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className={styles.signupContainer}>
      <Modal isOpen={showErrorModal} onClose={() => setShowErrorModal(false)}>
        <h3 style={{ marginBottom: 18, color: '#e53935' }}>Erro ao cadastrar</h3>
        <div style={{ color: '#222', fontSize: '1.08rem', marginBottom: 24 }}>{error}</div>
        <button
          className={styles.submitButton}
          style={{ width: 280, margin: '0 auto', display: 'block' }}
          onClick={() => setShowErrorModal(false)}
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
      <form onSubmit={handleSubmit}>
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
            style={touched.fullName && !form.fullName ? { borderColor: '#e74c3c' } : {}}
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
            style={touched.companyName && !form.companyName ? { borderColor: '#e74c3c' } : {}}
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
            style={touched.cnpj && !form.cnpj ? { borderColor: '#e74c3c' } : {}}
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
            style={touched.email && !form.email ? { borderColor: '#e74c3c' } : {}}
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
            style={touched.phone && !form.phone ? { borderColor: '#e74c3c' } : {}}
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
            onBlur={handleBlur}
            required
            disabled={isLoading}
            suppressHydrationWarning
            style={touched.password && !form.password ? { borderColor: '#e74c3c' } : {}}
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
              padding: 0,
              cursor: 'pointer',
              outline: 'none',
              height: 24,
              width: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
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
            onBlur={handleBlur}
            required
            disabled={isLoading}
            suppressHydrationWarning
            style={
              touched.confirmPassword && (!form.confirmPassword || passwordMatch === false)
                ? { borderColor: '#e74c3c' }
                : {}
            }
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
              padding: 0,
              cursor: 'pointer',
              outline: 'none',
              height: 24,
              width: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <EyeIcon open={showConfirmPassword} />
          </button>
          {touched.confirmPassword && form.confirmPassword && passwordMatch === false && (
            <div style={{ color: '#e74c3c', fontSize: '0.98rem', marginTop: 2 }}>
              As senhas não coincidem.
            </div>
          )}
          {touched.confirmPassword && form.confirmPassword && passwordMatch === true && (
            <div style={{ color: '#2e7d32', fontSize: '0.98rem', marginTop: 2 }}>
              Senhas coincidem.
            </div>
          )}
        </div>

        {process.env.NODE_ENV !== 'production' && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              zIndex: 10000,
              background: '#fff',
              color: '#222',
              padding: 4,
              fontSize: 12,
            }}
          >
            showSuccessModal: {String(showSuccessModal)}
          </div>
        )}
        <Modal isOpen={showSuccessModal} onClose={() => setShowSuccessModal(false)}>
          <h3 style={{ marginBottom: 18 }}>Cadastro realizado com sucesso!</h3>
          <div style={{ color: '#222', fontSize: '1.08rem', marginBottom: 24 }}>
            Seu cadastro será analisado e aprovado pela equipe ProLine.
          </div>
          <button
            className={styles.submitButton}
            style={{ width: 180, margin: '0 auto', display: 'block' }}
            onClick={() => router.push('/login')}
          >
            OK
          </button>
        </Modal>
        <button
          type="submit"
          className={styles.submitButton}
          disabled={isLoading || showSuccessModal}
        >
          {isLoading ? 'Cadastrando...' : 'Cadastrar'}
        </button>
      </form>
    </div>
  );
};

export default SignupPage;

'use client';
import React, { useState } from 'react';
import styles from './SignupPage.module.css';

const SignupPageSimple: React.FC = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    companyName: '',
    cnpj: '',
    phone: '',
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // eslint-disable-next-line no-alert
    alert('Formulário funcionando! Dados: ' + JSON.stringify(formData));
    // eslint-disable-next-line no-console
    console.log('Form submitted:', formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // eslint-disable-next-line no-console
    console.log('Field changed:', name, value);
  };

  return (
    <div className={styles.signupContainer}>
      <h2>Cadastro Simples - Teste</h2>
      <form onSubmit={handleSubmit}>
        <div className={styles.inputGroup}>
          <label htmlFor="fullName">Nome completo</label>
          <input
            type="text"
            id="fullName"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            required
          />
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>

        <button type="submit" className={styles.submitButton}>
          Cadastrar Simples
        </button>
      </form>
    </div>
  );
};

export default SignupPageSimple;

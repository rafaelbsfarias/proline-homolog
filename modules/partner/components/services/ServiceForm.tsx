import React from 'react';
import type { ServiceData } from '../../services/partnerClientService';
import styles from './ServiceForm.module.css';

interface ServiceFormProps {
  onSubmit: (data: ServiceData) => void;
  formId: string;
}

const ServiceForm: React.FC<ServiceFormProps> = ({ onSubmit, formId }) => {
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const category = formData.get('category') as string;

    const data: ServiceData = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      price: Number(formData.get('price')),
      ...(category && { category: category.trim() }), // Adiciona apenas se houver valor
    };
    onSubmit(data);
  };

  return (
    <form id={formId} onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.formGroup}>
        <label htmlFor="name" className={styles.label}>
          Nome do Serviço
        </label>
        <input type="text" id="name" name="name" required className={styles.input} />
      </div>
      <div className={styles.formGroup}>
        <label htmlFor="description" className={styles.label}>
          Descrição
        </label>
        <textarea id="description" name="description" required className={styles.textarea} />
      </div>
      <div className={styles.formGroup}>
        <label htmlFor="price" className={styles.label}>
          Preço (R$)
        </label>
        <input type="number" id="price" name="price" required className={styles.input} />
      </div>
      <div className={styles.formGroup}>
        <label htmlFor="category" className={styles.label}>
          Categoria (Opcional)
        </label>
        <input
          type="text"
          id="category"
          name="category"
          className={styles.input}
          placeholder="Ex: Mecânica Geral"
        />
      </div>
    </form>
  );
};

export default ServiceForm;

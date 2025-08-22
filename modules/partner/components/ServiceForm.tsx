import React from 'react';
import type { ServiceData } from '../services/partnerClientService';

interface ServiceFormProps {
  onSubmit: (data: ServiceData) => void;
  formId: string;
}

const ServiceForm: React.FC<ServiceFormProps> = ({ onSubmit, formId }) => {
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const data = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      // O campo 'estimated_days' não existe no formulário original, removendo para alinhar.
      // Se for necessário, deve ser adicionado ao JSX do formulário.
      estimated_days: Number(formData.get('estimated_days')),
      price: Number(formData.get('price')),
    };
    onSubmit(data);
  };

  return (
    <form id={formId} onSubmit={handleSubmit}>
      <div>
        <label htmlFor="name">Nome do Serviço</label>
        <input type="text" id="name" name="name" required />
      </div>
      <div>
        <label htmlFor="description">Descrição</label>
        <textarea id="description" name="description" required />
      </div>
      <div>
        <label htmlFor="estimated_days">Dias Estimados</label>
        <input type="number" id="estimated_days" name="estimated_days" required />
      </div>
      <div>
        <label htmlFor="price">Preço</label>
        <input type="number" id="price" name="price" required />
      </div>
    </form>
  );
};

export default ServiceForm;

import React, { forwardRef, useImperativeHandle, useRef } from 'react';

interface ServiceFormProps {
  onSubmit: (data: {
    name: string;
    description: string;
    estimated_days: number;
    price: number;
  }) => void;
}

export interface ServiceFormRef {
  submitForm: () => void;
}

const ServiceForm = forwardRef<ServiceFormRef, ServiceFormProps>(({ onSubmit }, ref) => {
  const formRef = useRef<HTMLFormElement>(null);

  useImperativeHandle(ref, () => ({
    submitForm: () => {
      formRef.current?.requestSubmit();
    },
  }));

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const data = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      estimated_days: Number(formData.get('estimated_days')),
      price: Number(formData.get('price')),
    };
    onSubmit(data);
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit}>
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
});

ServiceForm.displayName = 'ServiceForm';

export default ServiceForm;

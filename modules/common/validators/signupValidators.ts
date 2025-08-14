export const formatPhone = (value: string): string => {
  const phone = value.replace(/\D/g, '');
  if (phone.length <= 2) return phone;
  if (phone.length <= 7) return `(${phone.slice(0, 2)}) ${phone.slice(2)}`;
  if (phone.length <= 11) return `(${phone.slice(0, 2)}) ${phone.slice(2, 7)}-${phone.slice(7)}`;
  return `(${phone.slice(0, 2)}) ${phone.slice(2, 7)}-${phone.slice(7, 11)}`;
};
export const validateFullName = (name: string): string | null => {
  if (!name.trim()) return 'Preencha todos os campos obrigatórios.';
  if (name.trim().length < 5) return 'Nome completo deve ter pelo menos 5 caracteres.';
  return null;
};

export const validateCompanyName = (name: string): string | null => {
  if (!name.trim()) return 'Preencha todos os campos obrigatórios.';
  return null;
};

export const validateCNPJ = (cnpj: string): string | null => {
  const sanitized = cnpj.replace(/\D/g, '');
  if (sanitized.length !== 14) return 'CNPJ deve ter 14 dígitos.';
  if (/^(\d)\1{13}$/.test(sanitized)) return 'CNPJ inválido.';
  const calcDV = (base: string, weights: number[]) => {
    let sum = 0;
    for (let i = 0; i < weights.length; i++) {
      sum += parseInt(base[i]) * weights[i];
    }
    const rest = sum % 11;
    return rest < 2 ? 0 : 11 - rest;
  };
  const base12 = sanitized.slice(0, 12);
  const dv1 = calcDV(base12, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const base13 = base12 + dv1;
  const dv2 = calcDV(base13, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  if (parseInt(sanitized[12]) !== dv1 || parseInt(sanitized[13]) !== dv2) {
    return 'CNPJ inválido.';
  }
  return null;
};

export const validateEmail = (email: string): string | null => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!regex.test(email.trim())) return 'Email inválido.';
  return null;
};

export const validatePhone = (phone: string): string | null => {
  const sanitized = phone.replace(/\D/g, '');
  if (sanitized.length < 10) return 'Telefone deve ter pelo menos 10 dígitos.';
  return null;
};

export const validatePassword = (password: string): string | null => {
  if (password.length < 6) return 'Senha deve ter pelo menos 6 caracteres.';
  return null;
};

export const formatCNPJ = (value: string): string => {
  const cnpj = value.replace(/\D/g, '');
  if (cnpj.length <= 2) return cnpj;
  if (cnpj.length <= 5) return `${cnpj.slice(0, 2)}.${cnpj.slice(2)}`;
  if (cnpj.length <= 8) return `${cnpj.slice(0, 2)}.${cnpj.slice(2, 5)}.${cnpj.slice(5)}`;
  if (cnpj.length <= 12)
    return `${cnpj.slice(0, 2)}.${cnpj.slice(2, 5)}.${cnpj.slice(5, 8)}/${cnpj.slice(8)}`;
  return `${cnpj.slice(0, 2)}.${cnpj.slice(2, 5)}.${cnpj.slice(5, 8)}/${cnpj.slice(8, 12)}-${cnpj.slice(12, 14)}`;
};

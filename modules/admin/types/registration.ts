// Single Responsibility: Definição centralizada de tipos
export interface PendingRegistration {
  id: string;
  full_name: string;
  email: string;
  user_role: string;
  created_at: string;
  status: string;
}

// Interface unificada seguindo DRY Principle
export interface ApproveRegistrationData {
  full_name?: string;
  user_role?: string;
}

// Garantindo compatibilidade total (Object Calisthenics)
export type ApproveFields = ApproveRegistrationData;

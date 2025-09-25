/**
 * Schemas de validação para PartnerService API
 * Usando Zod para validação de entrada HTTP
 */

import { z } from 'zod';

// Schema para criação de serviço
export const CreateServiceSchema = z.object({
  partnerId: z.string().uuid('ID do parceiro deve ser um UUID válido'),
  name: z
    .string()
    .min(1, 'Nome do serviço é obrigatório')
    .max(100, 'Nome do serviço deve ter no máximo 100 caracteres')
    .trim(),
  price: z
    .number()
    .positive('Preço deve ser um valor positivo')
    .max(999999.99, 'Preço deve ser menor que 1.000.000'),
  description: z
    .string()
    .min(1, 'Descrição do serviço é obrigatória')
    .max(500, 'Descrição deve ter no máximo 500 caracteres')
    .trim(),
});

// Schema para atualização de serviço
export const UpdateServiceSchema = z.object({
  id: z.string().uuid('ID do serviço deve ser um UUID válido'),
  name: z
    .string()
    .min(1, 'Nome do serviço é obrigatório')
    .max(100, 'Nome do serviço deve ter no máximo 100 caracteres')
    .trim()
    .optional(),
  price: z
    .number()
    .positive('Preço deve ser um valor positivo')
    .max(999999.99, 'Preço deve ser menor que 1.000.000')
    .optional(),
  description: z
    .string()
    .min(1, 'Descrição do serviço é obrigatória')
    .max(500, 'Descrição deve ter no máximo 500 caracteres')
    .trim()
    .optional(),
});

// Schema para busca de serviços
export const SearchServicesSchema = z.object({
  partnerId: z.string().uuid('ID do parceiro deve ser um UUID válido').optional(),
  name: z
    .string()
    .min(1, 'Nome para busca é obrigatório')
    .max(100, 'Nome para busca deve ter no máximo 100 caracteres')
    .trim()
    .optional(),
  page: z.number().int().min(1, 'Página deve ser maior que 0').default(1),
  limit: z
    .number()
    .int()
    .min(1, 'Limite deve ser maior que 0')
    .max(100, 'Limite máximo é 100')
    .default(20),
});

// Schema para validação de nome único
export const ValidateServiceNameSchema = z.object({
  partnerId: z.string().uuid('ID do parceiro deve ser um UUID válido'),
  name: z
    .string()
    .min(1, 'Nome do serviço é obrigatório')
    .max(100, 'Nome do serviço deve ter no máximo 100 caracteres')
    .trim(),
  excludeServiceId: z.string().uuid('ID do serviço a excluir deve ser um UUID válido').optional(),
});

// Tipos inferidos dos schemas
export type CreateServiceRequest = z.infer<typeof CreateServiceSchema>;
export type UpdateServiceRequest = z.infer<typeof UpdateServiceSchema>;
export type SearchServicesRequest = z.infer<typeof SearchServicesSchema>;
export type ValidateServiceNameRequest = z.infer<typeof ValidateServiceNameSchema>;

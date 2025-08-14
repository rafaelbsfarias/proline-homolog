import { getLogger } from '@/modules/logger';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { EmailServiceFactory } from '@/modules/common/services/EmailServiceFactory';
import {
  sanitizeString,
  sanitizeForDatabase,
  validateEmail,
  validateCNPJ,
  validateName,
} from '@/modules/common/utils/inputSanitization';
import { ConflictError, DatabaseError, DomainError, ValidationError } from '@/lib/utils/errors';
import { User } from '@supabase/supabase-js'; // Assuming User type from Supabase

const logger = getLogger('CreateUserUseCase');

// Define Input and Output Interfaces
export interface CreateUserInput {
  name: string;
  email: string;
  role: 'admin' | 'specialist' | 'client' | 'partner';
  phone?: string;
  documentType?: string;
  document?: string;
  parqueamento?: string;
  quilometragem?: string;
  percentualFipe?: number;
  taxaOperacao?: number;
  companyName?: string;
}

export interface CreateUserOutput {
  userId?: string;
  emailSent: boolean;
  temporaryPassword?: string;
}

// Classe do Caso de Uso
export class CreateUserUseCase {
  private supabase = SupabaseService.getInstance().getAdminClient();
  private emailService = EmailServiceFactory.getInstance();

  // Método principal de execução do caso de uso
  async execute(input: CreateUserInput): Promise<CreateUserOutput> {
    const { name, email, role, phone, documentType, document, companyName } = input;
    logger.info(`Executing CreateUserUseCase for email: ${email}, role: ${role}`);
    logger.debug('Input data:', input);

    // 1. Sanitização e Validação de Entrada
    const sanitizedName = sanitizeForDatabase(sanitizeString(name));
    const sanitizedEmail = sanitizeString(email).toLowerCase();
    const sanitizedPhone = phone ? sanitizeString(phone) : undefined;
    const sanitizedDocument = document ? sanitizeString(document).replace(/\D/g, '') : undefined;
    const sanitizedCompanyName = companyName
      ? sanitizeForDatabase(sanitizeString(companyName))
      : undefined;

    if (!validateEmail(sanitizedEmail)) {
      logger.warn(`Validation Error: Invalid email format for ${sanitizedEmail}.`);
      throw new ValidationError('Email inválido.');
    }
    if (!validateName(sanitizedName)) {
      logger.warn(`Validation Error: Invalid name format for ${sanitizedName}.`);
      throw new ValidationError('Nome inválido.');
    }
    if (documentType === 'CNPJ' && sanitizedDocument) {
      const isValidCnpj = validateCNPJ(sanitizedDocument);
      if (!isValidCnpj) {
        logger.warn(`Validation Error: Invalid CNPJ for ${sanitizedDocument}.`);
        throw new ValidationError('CNPJ inválido.');
      }
    }
    logger.debug('Input data sanitized and validated.');

    logger.info('Checking for existing user with this email.');
    const { data: existingUsers, error: listUsersError } =
      await this.supabase.auth.admin.listUsers();
    if (listUsersError) {
      logger.error('Supabase listUsers error:', listUsersError);
      throw new DatabaseError(`Erro ao verificar usuários existentes: ${listUsersError.message}`);
    }
    const emailExists = existingUsers?.users?.some(
      (u: User) => u.email !== undefined && u.email === sanitizedEmail
    );
    if (emailExists) {
      logger.warn(`User creation failed: Email ${sanitizedEmail} already in use.`);
      throw new ConflictError('Este e-mail já está em uso.');
    }
    logger.info('Email is not in use, proceeding with user creation.');

    let temporaryPassword = '';
    let authUserId: string | undefined;

    try {
      temporaryPassword = this.generateTemporaryPassword();
      logger.info('Creating user in Supabase Auth.');
      const { data: authUser, error: authError } = await this.supabase.auth.admin.createUser({
        email: sanitizedEmail,
        password: temporaryPassword,
        email_confirm: true, // Admin aprova, então o email já é considerado confirmado
        user_metadata: {
          full_name: sanitizedName,
          role: role,
          created_by_admin: true,
          email_confirmed_at: new Date().toISOString(), // Definir timestamp de confirmação
          email_confirmed_by_admin: true, // Indicar que foi confirmado pelo admin
          phone: sanitizedPhone,
          document_type: documentType,
          document_number: sanitizedDocument,
          company_name: sanitizedCompanyName,
        },
      });

      if (authError || !authUser.user) {
        logger.error('Error creating user in Supabase Auth:', authError);
        throw new DatabaseError(
          `Erro ao criar usuário: ${authError?.message || 'Erro desconhecido'}`
        );
      }
      authUserId = authUser.user.id;
      logger.info(`User created in Supabase Auth with ID: ${authUserId}`);

      logger.info(`Creating profile for user ID: ${authUserId} with role: ${role}`);
      const { error: profileError } = await this.supabase.from('profiles').insert({
        id: authUserId,
        full_name: sanitizedName,
        role: role,
        status: 'active',
      });

      if (profileError) {
        if (
          profileError.message.includes('violates row-level security policy') ||
          profileError.code === '42501'
        ) {
          logger.error(
            `RLS Policy Violation: Failed to create profile for user ID ${authUserId} with role ${role}. ` +
              `Check RLS policies on 'profiles' table. Supabase error:`,
            profileError
          );
        } else {
          logger.error(`Error creating profile for user ${authUserId}:`, profileError);
        }
        throw new DatabaseError(`Erro ao criar perfil: ${profileError.message}`);
      }
      logger.info(`Profile created for user ID: ${authUserId}`);

      let specificTableError: any = null;
      if (role === 'client') {
        logger.info(`Creating client record for user ID: ${authUserId}`);
        const { parqueamento, quilometragem, percentualFipe, taxaOperacao } = input;
        const { error } = await this.supabase.from('clients').insert({
          profile_id: authUserId,
          document_type: documentType,
          document_number: sanitizedDocument,
          parqueamento: parqueamento,
          quilometragem: quilometragem,
          percentual_fipe: percentualFipe,
          taxa_operacao: taxaOperacao,
        });
        specificTableError = error;
      } else if (role === 'partner') {
        logger.info(`Creating partner record for user ID: ${authUserId}`);
        const { error } = await this.supabase.from('partners').insert({
          profile_id: authUserId,
          company_name: sanitizedCompanyName,
          cnpj: sanitizedDocument,
        });
        specificTableError = error;
      } else if (role === 'specialist') {
        logger.info(`Creating specialist record for user ID: ${authUserId}`);
        const { error } = await this.supabase.from('specialists').insert({
          profile_id: authUserId,
        });
        specificTableError = error;
      } else if (role === 'admin') {
        logger.info(`No specific table record needed for admin role for user ID: ${authUserId}`);
      }

      if (specificTableError) {
        logger.error(
          `Error creating specific table record for role ${role} and user ${authUserId}:`,
          specificTableError
        );
        throw new DatabaseError(
          `Erro ao criar registro para ${role}: ${specificTableError.message}`
        );
      }
      logger.info(`Specific table record created for user ID: ${authUserId} with role: ${role}.`);

      const friendlyRole = this.mapRoleToFriendly(role);
      let emailSubject = 'Cadastro Aprovado - ProLine Hub';
      let emailTemplateVariant: 'default' | 'invite' = 'default';

      if (role === 'partner') {
        emailSubject = 'Convite para o ProLine Hub - Seja nosso Parceiro!';
        emailTemplateVariant = 'invite';
      }

      if (role === 'client') {
        logger.info(`Sending registration success email to client ${sanitizedEmail}.`);
        await this.emailService.sendRegistrationSuccessEmail(sanitizedEmail, sanitizedName);
      } else {
        logger.info(`Sending welcome email to ${sanitizedEmail} with temporary password.`);
        await this.emailService.sendWelcomeEmailWithTemporaryPassword(
          sanitizedEmail,
          sanitizedName,
          temporaryPassword,
          friendlyRole
        );
      }
      logger.info(`Email sent to ${sanitizedEmail}.`);

      logger.info(`User ${authUserId} created successfully.`);
      return {
        userId: authUserId,
        emailSent: true,
        temporaryPassword: temporaryPassword,
      };
    } catch (error: unknown) {
      if (authUserId) {
        logger.warn(
          `Attempting rollback: Deleting auth user ${authUserId} due to creation failure.`
        );
        const { error: deleteError } = await this.supabase.auth.admin.deleteUser(authUserId);
        if (deleteError) {
          logger.error('Error during rollback (deleting auth user):', deleteError);
        } else {
          logger.info(`Auth user ${authUserId} deleted as part of rollback.`);
        }
      }
      logger.error('CreateUserUseCase failed:', error);
      throw error;
    }
  }

  // Helper para gerar senha temporária
  private generateTemporaryPassword(): string {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let out = '';
    for (let i = 0; i < 12; i++) out += chars[Math.floor(Math.random() * chars.length)];
    return out;
  }

  // Helper para mapear role para um nome amigável
  private mapRoleToFriendly(role: string): string {
    switch (role) {
      case 'admin':
        return 'Administrador';
      case 'specialist':
        return 'Especialista';
      case 'client':
        return 'Cliente';
      case 'partner':
        return 'Parceiro';
      default:
        return role;
    }
  }
}

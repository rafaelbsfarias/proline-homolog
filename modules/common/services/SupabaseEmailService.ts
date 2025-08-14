import { createClient } from '@supabase/supabase-js';
import { getSupabaseServiceKey, getSupabaseUrl } from '../utils/environmentSecurity';

/**
 * Serviço de email usando recursos nativos do Supabase
 * Integra com Supabase Auth e templates customizados
 */
export class SupabaseEmailService {
  private supabase;

  constructor() {
    this.supabase = createClient(getSupabaseUrl(), getSupabaseServiceKey());
  }

  /**
   * Envia email de aprovação usando APENAS recursos nativos do Supabase
   * O Supabase enviará email via SMTP configurado (Resend) com template personalizado
   */
  async sendApprovalEmail(options: {
    email: string;
    fullName: string;
    userId: string;
    sendConfirmationLink?: boolean;
    contractDetails?: {
      parqueamento: string;
      quilometragem: string;
      percentualFipe: number;
      taxaOperacao: number;
    };
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const { email, fullName, userId, sendConfirmationLink = true } = options;

      if (sendConfirmationLink) {
        // Usar apenas o sistema nativo do Supabase com SMTP configurado
        // Isso enviará um email personalizado via Resend com link seguro
        const { error: confirmError } = await this.supabase.auth.resend({
          type: 'signup',
          email,
          options: {
            emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?welcome=true&email_confirmed=true`,
          },
        });

        if (confirmError) {
          // Se falhar o resend, tentar confirmar diretamente o usuário
          const { error: directConfirmError } = await this.supabase.auth.admin.updateUserById(
            userId,
            {
              email_confirm: true,
              user_metadata: {
                approved: true,
                approval_timestamp: new Date().toISOString(),
                email_confirmed_by_admin: true,
                full_name: fullName,
              },
            }
          );

          if (directConfirmError) {
            return {
              success: false,
              error: `Erro ao confirmar email: ${confirmError.message} | ${directConfirmError.message}`,
            };
          }
        }
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: `Erro interno: ${error}` };
    }
  }

  /**
   * Envia email de rejeição de cadastro
   */
  async sendRejectionEmail(options: {
    email: string;
    fullName: string;
    reason?: string;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const { email, fullName, reason } = options;

      const { error: emailError } = await this.supabase.functions.invoke('send-rejection-email', {
        body: {
          to: email,
          fullName,
          reason: reason || 'Dados não atendem aos critérios de aprovação',
          supportEmail: process.env.SUPPORT_EMAIL || 'suporte@proline.com.br',
          siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
        },
      });

      if (emailError) {
        return { success: false, error: `Erro ao enviar email de rejeição: ${emailError.message}` };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: `Erro interno: ${error}` };
    }
  }

  /**
   * Fallback para email básico de aprovação sem Edge Function
   */
  private async sendBasicApprovalEmail(
    email: string,
    fullName: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Usar o sistema de auth do Supabase para envio básico
      const { error } = await this.supabase.auth.admin.inviteUserByEmail(email, {
        data: {
          full_name: fullName,
          approved: true,
          welcome_message: true,
        },
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/login?welcome=true`,
      });

      if (error) {
        return { success: false, error: `Erro no envio básico: ${error.message}` };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: `Erro interno no fallback: ${error}` };
    }
  }

  /**
   * Envia email personalizado para redefinição de senha
   */
  async sendPasswordResetEmail(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password`,
      });

      if (error) {
        return { success: false, error: `Erro ao enviar email de redefinição: ${error.message}` };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: `Erro interno: ${error}` };
    }
  }
}

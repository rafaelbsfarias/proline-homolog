import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { ConflictError, DatabaseError } from '@/modules/common/errors';

interface SignupData {
  fullName: string;
  companyName: string;
  cnpj: string;
  email: string;
  phone: string;
  password: string;
}

export class SignupService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = SupabaseService.getInstance().getAdminClient();
  }

  async registerUser(data: SignupData): Promise<string> {
    // 1. Create user in Supabase Auth
    const { data: user, error: userError } = await this.supabase.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: false, // Pending approval
      user_metadata: {
        full_name: data.fullName,
        phone: data.phone,
      },
    });

    if (userError) {
      if (userError.code === 'email_exists') {
        throw new ConflictError('Este e-mail já foi cadastrado.');
      }
      throw new DatabaseError(`Erro ao criar usuário: ${userError.message}`);
    }

    const userId = user.user.id;

    try {
      // 2. Create profile
      const { error: profileError } = await this.supabase.from('profiles').insert({
        id: userId,
        full_name: data.fullName,
        role: 'client',
      });

      if (profileError) {
        throw new DatabaseError(`Erro ao criar profile: ${profileError.message}`);
      }

      // 3. Create client record
      const { error: clientError } = await this.supabase.from('clients').insert({
        profile_id: userId,
        document_type: 'cnpj',
        document_number: data.cnpj,
        company_name: data.companyName,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (clientError) {
        // Check for unique constraint violation on document_number
        if (clientError.message.includes('clients_document_number_key')) {
          throw new ConflictError('Este CNPJ já está cadastrado.');
        }
        throw new DatabaseError(`Erro ao criar client: ${clientError.message}`);
      }

      return userId;
    } catch (error) {
      // Rollback: If any step after auth user creation fails, delete the auth user.
      await this.supabase.auth.admin.deleteUser(userId);
      throw error; // Re-throw the original error
    }
  }
}

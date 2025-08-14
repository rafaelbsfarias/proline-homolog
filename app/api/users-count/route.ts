import { NextResponse } from 'next/server';
import { SupabaseService } from '@/modules/common/services/SupabaseService';

export async function GET() {
  const supabase = SupabaseService.getInstance().getAdminClient();

  // Chama o endpoint admin/users para contar usuários
  const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1 });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  // O total está em data.total
  return NextResponse.json({ count: data.total });
}

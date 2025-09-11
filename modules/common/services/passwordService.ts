import { supabase } from '@/modules/common/services/supabaseClient';

export async function changeUserPassword(password: string) {
  // Atualiza senha do usuário
  const { error: updateError } = await supabase.auth.updateUser({ password });
  if (updateError) throw new Error(updateError.message);

  // Obtém o ID do usuário
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user.id;
  if (!userId) throw new Error('Usuário não encontrado.');

  // Atualiza flag no perfil
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ must_change_password: false })
    .eq('id', userId);

  if (profileError) throw new Error('Senha alterada, mas falha ao atualizar perfil.');
}

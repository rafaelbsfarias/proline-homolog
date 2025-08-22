/**
 * Gera uma senha temporária segura.
 * @param length O comprimento da senha a ser gerada. O padrão é 12.
 * @returns A senha temporária gerada.
 */
export function generateTemporaryPassword(length = 12): string {
  // Caracteres selecionados para evitar ambiguidades (sem I, l, 1, 0, O).
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

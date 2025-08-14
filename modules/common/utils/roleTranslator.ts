// Single Responsibility: Tradução de roles
export class RoleTranslator {
  private static readonly ROLE_TRANSLATIONS = {
    admin: 'Administrador',
    specialist: 'Especialista',
    client: 'Cliente',
  } as const;

  static translate(role: string): string {
    const normalizedRole = role.toLowerCase() as keyof typeof RoleTranslator.ROLE_TRANSLATIONS;
    return RoleTranslator.ROLE_TRANSLATIONS[normalizedRole] || role;
  }

  static getAvailableRoles(): Array<{ value: string; label: string }> {
    return Object.entries(RoleTranslator.ROLE_TRANSLATIONS).map(([value, label]) => ({
      value,
      label,
    }));
  }
}

// Export individual para compatibilidade
export const translateRole = (role: string): string => RoleTranslator.translate(role);

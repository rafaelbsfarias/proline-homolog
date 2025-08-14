import { ForbiddenError } from '@/lib/utils/errors';
import { User } from '@supabase/supabase-js';

export type AppRole = 'admin' | 'client' | 'partner' | 'specialist';

export function requireRole(user: User, requiredRole: AppRole): void {
  const userRoles: string[] = (user.app_metadata?.roles as string[]) ?? [];

  if (!userRoles.includes(requiredRole)) {
    throw new ForbiddenError(`Access restricted. Only ${requiredRole} role allowed.`);
  }
}

export function requireAnyRole(user: User, requiredRoles: AppRole[]): void {
  const userRoles: string[] = (user.app_metadata?.roles as string[]) ?? [];

  if (!requiredRoles.some(role => userRoles.includes(role))) {
    throw new ForbiddenError(`Access restricted. Requires one of: ${requiredRoles.join(', ')}.`);
  }
}

// Centralized feature flags to control gradual rollouts safely
export const FLAGS = {
  // Enable the refactored client dashboard (V2) experience
  // Controlled via env: NEXT_PUBLIC_CLIENT_DASH_V2=("1"|"true")
  CLIENT_DASH_V2:
    process.env.NEXT_PUBLIC_CLIENT_DASH_V2 === '1' ||
    process.env.NEXT_PUBLIC_CLIENT_DASH_V2 === 'true',
} as const;

export type FlagKey = keyof typeof FLAGS;
export function isEnabled(flag: FlagKey): boolean {
  return Boolean(FLAGS[flag]);
}

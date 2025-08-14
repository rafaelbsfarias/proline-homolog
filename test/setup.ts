// ========================================================================================
// TEST SETUP - CONFIGURAÇÃO GLOBAL PARA TESTES
// ========================================================================================
// Setup global para Vitest com mocks e configurações essenciais
// ========================================================================================

import { vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll } from 'vitest';

// ========================================================================================
// CLEANUP AFTER EACH TEST
// ========================================================================================
afterEach(() => {
  cleanup();
});

// ========================================================================================
// GLOBAL MOCKS
// ========================================================================================

// Mock Next.js router
vi.mock('next/router', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
    pathname: '/',
    query: {},
    asPath: '/',
    route: '/',
    events: {
      on: vi.fn(),
      off: vi.fn(),
      emit: vi.fn(),
    },
  }),
}));

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock Supabase
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(),
      getUser: vi.fn(),
      onAuthStateChange: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
      order: vi.fn().mockReturnThis(),
    })),
  })),
}));

// Mock environment variables
beforeAll(() => {
  // Supabase
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co');
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-key');
  vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'test-service-key');

  // JWT
  vi.stubEnv('JWT_ACCESS_SECRET', 'test-access-secret');
  vi.stubEnv('JWT_REFRESH_SECRET', 'test-refresh-secret');

  // Other
  vi.stubEnv('NODE_ENV', 'test');
});

// ========================================================================================
// GLOBAL TEST UTILITIES
// ========================================================================================

// Mock crypto for tests (if needed)
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => 'test-uuid-' + Math.random().toString(36).substr(2, 9),
    getRandomValues: (arr: any) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    },
  },
});

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
});

// Mock console methods for cleaner test output
global.console = {
  ...console,
  // Comment out these lines if you want to see console output in tests
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

// ========================================================================================
// HELPER FUNCTIONS FOR TESTS
// ========================================================================================

// Create mock user for tests
export const createMockUser = (overrides = {}) => ({
  id: 'test-user-id',
  email: 'test@example.com',
  role: 'client',
  status: 'active',
  profile: {
    firstName: 'Test',
    lastName: 'User',
    phone: '11999999999',
    preferences: {
      theme: 'light',
      language: 'pt-BR',
      notifications: {
        email: true,
        push: false,
        sms: false,
      },
    },
  },
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

// Create mock auth response
export const createMockAuthResponse = (overrides = {}) => ({
  userId: 'test-user-id',
  email: 'test@example.com',
  role: 'client',
  accessToken: 'test-access-token',
  refreshToken: 'test-refresh-token',
  ...overrides,
});

// Create mock result success
export const createMockSuccess = <T>(data: T) => ({
  success: true as const,
  data,
});

// Create mock result error
export const createMockError = (message: string) => ({
  success: false as const,
  error: new Error(message),
});

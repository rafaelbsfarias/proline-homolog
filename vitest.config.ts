// ========================================================================================
// VITEST CONFIGURATION - UNIT TESTING SETUP
// ========================================================================================
// Configuração completa do Vitest para testes unitários
// ========================================================================================

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],

  test: {
    // ========================================================================================
    // ENVIRONMENT SETUP
    // ========================================================================================
    globals: true,
    environment: 'jsdom',

    // ========================================================================================
    // FILES AND PATTERNS
    // ========================================================================================
    include: [
      '**/*.{test,spec}.?(c|m)[jt]s?(x)',
      'modules/**/__tests__/**/*.{test,spec}.?(c|m)[jt]s?(x)',
    ],
    exclude: ['node_modules/**', 'dist/**', '.next/**', 'cypress/**', 'complexo/**'],

    // ========================================================================================
    // SETUP FILES
    // ========================================================================================
    setupFiles: ['./test/setup.ts'],

    // ========================================================================================
    // CSS AND ASSETS
    // ========================================================================================
    css: true,

    // ========================================================================================
    // COVERAGE CONFIGURATION
    // ========================================================================================
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/',
        'test/',
        '**/*.test.{ts,tsx,js,jsx}',
        '**/*.spec.{ts,tsx,js,jsx}',
        '**/*.config.{ts,js}',
        '**/*.d.ts',
        'cypress/',
        '.next/',
        'dist/',
        'public/',
        'complexo/',
      ],
      all: true,
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 70,
        statements: 80,
      },
    },

    // ========================================================================================
    // PERFORMANCE
    // ========================================================================================
    pool: 'threads',
    poolOptions: {
      threads: {
        maxThreads: 4,
        minThreads: 1,
      },
    },

    // ========================================================================================
    // TIMEOUTS
    // ========================================================================================
    testTimeout: 10000,
    hookTimeout: 10000,

    // ========================================================================================
    // REPORTER
    // ========================================================================================
    reporters: ['verbose', 'junit'],
    outputFile: {
      junit: './test-results/junit.xml',
    },

    // ========================================================================================
    // ENVIRONMENT VARIABLES
    // ========================================================================================
    env: {
      NODE_ENV: 'test',
      // Supabase test environment
      NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-key',
      SUPABASE_SERVICE_ROLE_KEY: 'test-service-key',

      // JWT secrets for testing
      JWT_ACCESS_SECRET: 'test-access-secret',
      JWT_REFRESH_SECRET: 'test-refresh-secret',
    },

    // ========================================================================================
    // MOCKS
    // ========================================================================================
    mockReset: true,
    clearMocks: true,
    restoreMocks: true,

    // ========================================================================================
    // ALIAS RESOLUTION
    // ========================================================================================
    alias: {
      '@': path.resolve(__dirname, './'),
      '@/app': path.resolve(__dirname, './app'),
      '@/modules': path.resolve(__dirname, './modules'),
      '@/lib': path.resolve(__dirname, './lib'),
      '@/utils': path.resolve(__dirname, './utils'),
      '@/components': path.resolve(__dirname, './app/components'),
    },
  },

  // ========================================================================================
  // VITE CONFIGURATION FOR TESTS
  // ========================================================================================
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      '@/app': path.resolve(__dirname, './app'),
      '@/modules': path.resolve(__dirname, './modules'),
      '@/lib': path.resolve(__dirname, './lib'),
      '@/utils': path.resolve(__dirname, './utils'),
      '@/components': path.resolve(__dirname, './app/components'),
    },
  },
});

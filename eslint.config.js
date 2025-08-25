// ========================================================================================
// ESLINT CONFIGURATION - WITH TYPESCRIPT SUPPORT
// ========================================================================================

import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import securityPlugin from 'eslint-plugin-security';

export default [
  {
    ignores: [
      '.next/**',
      'dist/**',
      'build/**',
      'coverage/**',
      'node_modules/**',
      'public/**',
      '.vercel/**',
      '.git/**',
      '**/*.d.ts',
      '.husky/**',
      'cypress/downloads/**',
      'cypress/screenshots/**',
      'cypress/videos/**',
      '*.config.js',
      '*.config.ts',
      'reports/**',
    ],
  },
  // JavaScript files
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        global: 'readonly',
        window: 'readonly',
        document: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        fetch: 'readonly',
        FormData: 'readonly',
        URLSearchParams: 'readonly',
        URL: 'readonly',
        Headers: 'readonly',
        Request: 'readonly',
        Response: 'readonly',
        React: 'readonly',
        JSX: 'readonly',
        require: 'readonly',
        module: 'readonly',
      },
    },
    plugins: {
      security: securityPlugin,
    },
    rules: {
      'no-console': 'warn',
      'no-debugger': 'error',
      'no-alert': 'error',
      'no-var': 'error',
      'prefer-const': 'error',
      'no-unused-vars': 'warn',
      'no-undef': 'error',
      'security/detect-unsafe-regex': 'error',
      'security/detect-buffer-noassert': 'error',
      'security/detect-child-process': 'warn',
      'security/detect-eval-with-expression': 'error',
      'security/detect-pseudoRandomBytes': 'warn',
      'security/detect-possible-timing-attacks': 'warn',
      'security/detect-new-buffer': 'error',
    },
  },
  // TypeScript files
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        global: 'readonly',
        window: 'readonly',
        document: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        fetch: 'readonly',
        FormData: 'readonly',
        URLSearchParams: 'readonly',
        URL: 'readonly',
        Headers: 'readonly',
        Request: 'readonly',
        Response: 'readonly',
        React: 'readonly',
        JSX: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      security: securityPlugin,
    },
    rules: {
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'warn',
      'no-debugger': 'error',
      'no-alert': 'error',
      'no-var': 'error',
      'prefer-const': 'error',
      'no-unused-vars': 'off',
      'no-undef': 'off',
      'security/detect-unsafe-regex': 'error',
      'security/detect-buffer-noassert': 'error',
      'security/detect-child-process': 'warn',
      'security/detect-eval-with-expression': 'error',
      'security/detect-pseudoRandomBytes': 'warn',
      'security/detect-possible-timing-attacks': 'warn',
      'security/detect-new-buffer': 'error',
    },
  },
  // Test files
  {
    files: ['**/*.test.{ts,tsx,js,jsx}', '**/__tests__/**/*.{ts,tsx,js,jsx}'],
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  // Cypress files
  {
    files: ['cypress/**/*.{ts,js}'],
    languageOptions: {
      globals: {
        cy: 'readonly',
        Cypress: 'readonly',
        expect: 'readonly',
        assert: 'readonly',
      },
    },
    rules: {
      'no-console': 'off',
      'no-undef': 'off',
    },
  },
];

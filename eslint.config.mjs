// Shared flat config for all workspaces. Run `npm run lint` at the root or in any package.
import eslint from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['**/dist/**', '**/node_modules/**', '**/src/generated/**', '**/prisma/migrations/**', 'eslint.config.mjs'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      globals: { ...globals.node },
      parserOptions: {
        projectService: {
          // Seeds and tests sit outside each tsconfig's "include"; lint them with a default project.
          allowDefaultProject: ['*/prisma/*.ts', 'placement-mcp-server/src/*.test.ts'],
          defaultProject: 'placement-mcp-server/tsconfig.json',
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports', disallowTypeAnnotations: false }],
      eqeqeq: ['error', 'smart'],
    },
  },
  {
    // NestJS relies on decorator metadata, so DI-injected classes must stay value imports.
    files: ['job-portal-api/src/**/*.ts', 'campus-placement-api/src/**/*.ts'],
    rules: {
      '@typescript-eslint/consistent-type-imports': 'off',
      '@typescript-eslint/no-extraneous-class': 'off',
    },
  },
  {
    // node:test's test() returns a promise the runner already tracks.
    files: ['**/*.test.ts'],
    rules: { '@typescript-eslint/no-floating-promises': 'off' },
  },
);

import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import nextPlugin from '@next/eslint-plugin-next';
import prettierConfig from 'eslint-config-prettier';

export default [
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.next/**',
      '**/coverage/**',
      // Generated Prisma client for the IdP schema. It happens to live under
      // src/ because that is where prisma/idp-schema.prisma points its output,
      // but it is build output, not source: `pnpm db:generate` overwrites it
      // wholesale, so any lint finding here is unfixable by definition.
      'packages/database/src/idp-client/**',
    ],
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      'no-console': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_' },
      ],
      'no-unused-vars': 'off',
    },
  },
  {
    files: ['**/*.spec.ts', '**/*.test.ts', '**/tests/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'off',
    },
  },
  {
    // Seed and provisioning scripts are CLIs whose entire interface is stdout:
    // an operator runs one and reads what it did. Telling them what was
    // provisioned is the point, not a debug leftover. Exempting the directory
    // is better than a file-level `eslint-disable` in each script — the
    // suppression ratchet counts those, so the per-file form makes adding a
    // legitimate script look like new debt.
    files: ['packages/database/prisma/**/*.ts'],
    rules: {
      'no-console': 'off',
    },
  },
  {
    // Long-standing exemption for the backend tree. `apps/idp` and
    // `apps/developer` are added because they are overwhelmingly `apps/api/src`
    // code relocated by the platform split — auth/SSO services into the IdP,
    // builder/studio services into the developer platform. Holding relocated
    // code to a stricter rule than it met yesterday would report ~690 "new"
    // violations that are neither new nor newly written, and would say nothing
    // about whether the split is correct.
    //
    // `any` here is not unpoliced: the suppression ratchet
    // (scripts/ci/check-suppressions.mjs) now scans the whole `apps` and
    // `packages` workspaces (ADR-006) and its count may only fall. That is the
    // mechanism that retires this debt; the eslint rule was never doing it.
    files: [
      'apps/api/src/**/*.ts',
      'apps/idp/src/**/*.ts',
      'apps/developer/src/**/*.ts',
      // The builder UI relocated here from apps/web/src/components/builder,
      // which is exempted on the next lines; keep it exempt at its new path.
      'apps/developer/src/**/*.tsx',
      'apps/web/src/components/builder/**/*.tsx',
      'apps/web/src/components/builder/**/*.ts',
      'apps/web/src/lib/hooks/useBuilderData.ts',
    ],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
  {
    files: ['apps/api/src/modules/**/*.controller.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@unerp/database',
              message: 'Database/Prisma direct access in module controllers is forbidden. Move all database queries to services.',
            },
            {
              name: '@prisma/client',
              importNames: ['PrismaClient'],
              message: 'Prisma Client direct usage in module controllers is forbidden. Move all database queries to services.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['apps/web/**/*.ts', 'apps/web/**/*.tsx'],
    plugins: {
      'react-hooks': reactHooksPlugin,
      '@next/next': nextPlugin,
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'react-hooks/exhaustive-deps': 'warn',
      '@next/next/no-img-element': 'warn',
    },
  },
  {
    // Data-layer consolidation: pages must use @unerp/framework hooks
    // (useResourceList/useResourceDoc/mutations), not raw fetch + tokens.
    files: ['apps/web/app/**/*.ts', 'apps/web/app/**/*.tsx'],
    rules: {
      'no-restricted-syntax': [
        'warn',
        {
          selector: "CallExpression[callee.name='fetch'] > Literal[value=/^\\/api/]",
          message:
            'Raw fetch("/api…") in pages is deprecated — use the @unerp/framework data hooks (useResourceList/useResourceDoc/useCreate/Update/DeleteResource).',
        },
        {
          selector: "CallExpression[callee.name='fetch'] > TemplateLiteral[quasis.0.value.raw=/^\\/api/]",
          message:
            'Raw fetch(`/api…`) in pages is deprecated — use the @unerp/framework data hooks (useResourceList/useResourceDoc/useCreate/Update/DeleteResource).',
        },
        {
          selector:
            "CallExpression[callee.object.name='localStorage'][callee.property.name='getItem'] > Literal[value='token']",
          message:
            'Reading the auth token directly is deprecated — the @unerp/framework ApiClient attaches auth/tenant/CSRF headers for you.',
        },
      ],
    },
  },
  prettierConfig,
];

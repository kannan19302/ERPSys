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
    files: [
      'apps/api/src/**/*.ts',
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

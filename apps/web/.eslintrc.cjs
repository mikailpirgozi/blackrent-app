/* eslint config for FE (Vite/React) + BE (Node) */
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: [
    '@typescript-eslint',
    'react',
    'react-hooks',
    'import',
    'vitest',
    'vitest-globals',
  ],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'prettier', // always last
  ],
  settings: {
    react: { version: 'detect' },
  },
  env: {
    browser: true,
    node: true,
    es2023: true,
  },
  ignorePatterns: [
    'node_modules/',
    'dist/',
    'build/',
    '.vite/',
    'coverage/',
    'archive/**', // archívne súbory neupravujeme
    'customer-website/Anima/**', // export z Anima neupravujeme
    'Figma-Context-MCP/**', // MCP server
  ],
  rules: {
    // TypeScript - STRICT RULES
    '@typescript-eslint/no-explicit-any': 'error', // VŽDY error
    '@typescript-eslint/no-unused-vars': 'error', // VŽDY error
    '@typescript-eslint/consistent-type-imports': 'error',
    '@typescript-eslint/ban-ts-comment': 'error',

    // React - STRICT RULES
    'react/prop-types': 'off',
    'react/no-unescaped-entities': 'off',
    'react/react-in-jsx-scope': 'off',
    'react-hooks/exhaustive-deps': 'error', // VŽDY error

    // Importy - zjednodušené
    'import/order': 'off',
    'import/no-unresolved': 'off',
    'import/namespace': 'off',
    'import/default': 'off',
    'import/no-named-as-default': 'off',
    'import/no-named-as-default-member': 'off',

    // Konzoly: povoliť warn/error, zakázať log len v produkcii
    'no-console':
      process.env.NODE_ENV === 'production'
        ? ['error', { allow: ['warn', 'error'] }]
        : 'off',

    // Case declarations: VŽDY error
    'no-case-declarations': 'error',

    // Banned types: VŽDY error
    '@typescript-eslint/ban-types': 'error',

    // Test files: vitest globals
    'vitest/no-disabled-tests': 'warn',
  },
  overrides: [
    // Frontend (React)
    {
      files: ['src/**/*.{ts,tsx}'],
      env: { browser: true },
    },
    // Backend (Node)
    {
      files: ['backend/**/*.{ts,tsx}'],
      env: { node: true },
      rules: {
        'react/jsx-uses-react': 'off',
        'react/react-in-jsx-scope': 'off',
      },
    },
    // Testy
    {
      files: ['**/*.{test,spec}.{ts,tsx}'],
      env: { 'vitest-globals/env': true },
      rules: {
        '@typescript-eslint/no-unused-vars': [
          'warn',
          { argsIgnorePattern: '^_' },
        ],
      },
    },
  ],
};

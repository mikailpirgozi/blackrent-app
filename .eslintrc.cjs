/* eslint config for FE (Vite/React) + BE (Node) */
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
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
    // TypeScript
    '@typescript-eslint/no-explicit-any':
      process.env.NODE_ENV === 'production' ? 'error' : 'warn',
    '@typescript-eslint/consistent-type-imports': 'warn',

    // React
    'react/prop-types': 'off',
    'react/no-unescaped-entities': 'off', // povoliť úvodzovky v JSX
    'react/react-in-jsx-scope': 'off', // React 17+ automatický import

    // Importy - zjednodušené
    'import/order': 'off', // vypnuté kvôli resolver problémom
    'import/no-unresolved': 'off', // vypnuté kvôli resolver problémom
    'import/namespace': 'off',
    'import/default': 'off',
    'import/no-named-as-default': 'off',
    'import/no-named-as-default-member': 'off',

    // Konzoly: povoliť warn/error, zakázať log len v produkcii
    'no-console':
      process.env.NODE_ENV === 'production'
        ? ['error', { allow: ['warn', 'error'] }]
        : 'off',

    // Nepoužívané premenné: len warning v development
    '@typescript-eslint/no-unused-vars':
      process.env.NODE_ENV === 'production' ? 'error' : 'warn',

    // Case declarations: povoliť v development
    'no-case-declarations':
      process.env.NODE_ENV === 'production' ? 'error' : 'off',

    // Banned types: povoliť v development
    '@typescript-eslint/ban-types':
      process.env.NODE_ENV === 'production' ? 'error' : 'off',

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

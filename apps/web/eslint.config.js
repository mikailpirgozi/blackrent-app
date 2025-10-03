import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';

export default [
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'build/**',
      '.vite/**',
      'coverage/**',
      'archive/**',
      'customer-website/Anima/**',
      'Figma-Context-MCP/**',
      'apps/mobile/**',
      'packages/**/dist/**',
      '../../src 2/**',
      '../../backend/**',
      '../../packages/**',
      '../../../backend/**',
      '**/backend/**',
      '*.config.js',
      '*.config.ts',
      'public/sw.js',
      'public/sw-dev.js',
      'apps/web/**',
      '**/*.test.ts',
      '**/*.test.tsx',
      '**/__tests__/**',
      'src/test/**',
      'src/setupTests.ts',
      '.eslintrc.cjs'
    ]
  },
  // JavaScript files
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        process: 'readonly',
        React: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        fetch: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        global: 'readonly',
        require: 'readonly',
        module: 'readonly',
        exports: 'readonly',
        self: 'readonly',
        caches: 'readonly'
      }
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-console': process.env.NODE_ENV === 'production' 
        ? ['error', { allow: ['warn', 'error'] }] 
        : 'off',
      'no-debugger': 'error',
      'no-case-declarations': 'error',
      'no-var': 'error',
      'prefer-const': 'error'
    }
  },
  // TypeScript files
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true
        },
        project: true,
        tsconfigRootDir: import.meta.dirname
      },
      globals: {
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        process: 'readonly',
        React: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        fetch: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        global: 'readonly',
        require: 'readonly',
        module: 'readonly',
        exports: 'readonly',
        // Browser APIs
        File: 'readonly',
        FileReader: 'readonly',
        Blob: 'readonly',
        URL: 'readonly',
        Image: 'readonly',
        ImageBitmap: 'readonly',
        createImageBitmap: 'readonly',
        ImageOrientation: 'readonly',
        HTMLCanvasElement: 'readonly',
        HTMLInputElement: 'readonly',
        HTMLImageElement: 'readonly',
        HTMLVideoElement: 'readonly',
        HTMLDivElement: 'readonly',
        HTMLElement: 'readonly',
        Element: 'readonly',
        KeyboardEvent: 'readonly',
        ErrorEvent: 'readonly',
        IntersectionObserver: 'readonly',
        IntersectionObserverEntry: 'readonly',
        IntersectionObserverInit: 'readonly',
        PushSubscription: 'readonly',
        ServiceWorkerRegistration: 'readonly',
        NotificationPermission: 'readonly',
        Notification: 'readonly',
        URLSearchParams: 'readonly',
        BufferSource: 'readonly',
        navigator: 'readonly',
        performance: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        requestAnimationFrame: 'readonly',
        alert: 'readonly',
        NodeJS: 'readonly',
        // Additional browser APIs
        Event: 'readonly',
        CustomEvent: 'readonly',
        EventListener: 'readonly',
        EventTarget: 'readonly',
        AddEventListenerOptions: 'readonly',
        MessageEvent: 'readonly',
        MessageChannel: 'readonly',
        StorageEvent: 'readonly',
        MediaQueryListEvent: 'readonly',
        Navigator: 'readonly',
        Performance: 'readonly',
        PerformanceEntry: 'readonly',
        PerformanceObserver: 'readonly',
        PerformanceResourceTiming: 'readonly',
        MediaStream: 'readonly',
        MediaStreamConstraints: 'readonly',
        FormData: 'readonly',
        FileList: 'readonly',
        HTMLFormElement: 'readonly',
        HTMLLinkElement: 'readonly',
        SVGElement: 'readonly',
        Window: 'readonly',
        Response: 'readonly',
        RequestInit: 'readonly',
        AbortController: 'readonly',
        AbortSignal: 'readonly',
        IdleDeadline: 'readonly',
        requestIdleCallback: 'readonly',
        btoa: 'readonly',
        atob: 'readonly',
        caches: 'readonly',
        clients: 'readonly',
        self: 'readonly',
        Headers: 'readonly',
        // Test globals
        test: 'readonly',
        expect: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        vi: 'readonly',
        vitest: 'readonly',
        // Additional DOM types
        BlobPart: 'readonly',
        FilePropertyBag: 'readonly',
        BlobPropertyBag: 'readonly',
        DOMException: 'readonly',
        ProgressEvent: 'readonly',
        MediaSource: 'readonly',
        ImageBitmapSource: 'readonly',
        ImageBitmapOptions: 'readonly',
        KeyboardEventInit: 'readonly',
        ErrorEventInit: 'readonly',
        IntersectionObserverCallback: 'readonly',
        NotificationOptions: 'readonly',
        TimerHandler: 'readonly',
        FrameRequestCallback: 'readonly'
      }
    },
    plugins: {
      '@typescript-eslint': tseslint
    },
    rules: {
      ...js.configs.recommended.rules,
      ...tseslint.configs.recommended.rules,
      
      // Základné pravidlá
      'no-console': process.env.NODE_ENV === 'production' 
        ? ['error', { allow: ['warn', 'error'] }] 
        : 'off',
      'no-debugger': 'error',
      'no-case-declarations': 'error',
      'no-var': 'error',
      'prefer-const': 'error',
      
      // TypeScript specific
      '@typescript-eslint/no-unused-vars': ['warn', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^(_|error|err|fallbackError|permError)$',
        ignoreRestSiblings: true
      }],
      'no-unused-vars': 'off', // Turn off base rule as it conflicts with TS version
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      'no-redeclare': 'off',
      '@typescript-eslint/no-redeclare': 'error'
    }
  }
];
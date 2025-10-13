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
      '*.config.js',
      '*.config.ts',
      '**/vite-env.d.ts'
    ]
  },
  {
    files: ['**/*.{js,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parser: tsparser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        }
      },
      globals: {
        // Browser globals
        window: 'readonly',
        Window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        navigator: 'readonly',
        alert: 'readonly',
        crypto: 'readonly',
        btoa: 'readonly',
        
        // Timers
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        requestIdleCallback: 'readonly',
        
        // DOM types
        HTMLElement: 'readonly',
        HTMLInputElement: 'readonly',
        HTMLTextAreaElement: 'readonly',
        HTMLDivElement: 'readonly',
        HTMLImageElement: 'readonly',
        HTMLVideoElement: 'readonly',
        HTMLCanvasElement: 'readonly',
        HTMLFormElement: 'readonly',
        HTMLButtonElement: 'readonly',
        HTMLHeadingElement: 'readonly',
        HTMLParagraphElement: 'readonly',
        HTMLOListElement: 'readonly',
        HTMLUListElement: 'readonly',
        HTMLLIElement: 'readonly',
        HTMLAnchorElement: 'readonly',
        HTMLSpanElement: 'readonly',
        HTMLLinkElement: 'readonly',
        HTMLTableElement: 'readonly',
        HTMLTableSectionElement: 'readonly',
        HTMLTableRowElement: 'readonly',
        HTMLTableCellElement: 'readonly',
        HTMLTableCaptionElement: 'readonly',
        SVGElement: 'readonly',
        SVGSVGElement: 'readonly',
        Element: 'readonly',
        EventTarget: 'readonly',
        KeyboardEvent: 'readonly',
        Event: 'readonly',
        ErrorEvent: 'readonly',
        MessageEvent: 'readonly',
        CustomEvent: 'readonly',
        CustomEventInit: 'readonly',
        StorageEvent: 'readonly',
        MediaQueryListEvent: 'readonly',
        EventListener: 'readonly',
        AddEventListenerOptions: 'readonly',
        
        // Web APIs
        fetch: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        FormData: 'readonly',
        File: 'readonly',
        Blob: 'readonly',
        Image: 'readonly',
        IntersectionObserver: 'readonly',
        IntersectionObserverEntry: 'readonly',
        IntersectionObserverInit: 'readonly',
        MediaStream: 'readonly',
        MediaStreamConstraints: 'readonly',
        ServiceWorkerRegistration: 'readonly',
        NotificationPermission: 'readonly',
        Navigator: 'readonly',
        RequestInit: 'readonly',
        AbortController: 'readonly',
        AbortSignal: 'readonly',
        MessageChannel: 'readonly',
        WakeLockSentinel: 'readonly',
        performance: 'readonly',
        requestAnimationFrame: 'readonly',
        caches: 'readonly',
        Response: 'readonly',
        FileReader: 'readonly',
        ImageBitmap: 'readonly',
        createImageBitmap: 'readonly',
        ImageOrientation: 'readonly',
        Worker: 'readonly',
        IDBDatabase: 'readonly',
        IDBOpenDBRequest: 'readonly',
        IDBKeyRange: 'readonly',
        IDBRequest: 'readonly',
        IdleDeadline: 'readonly',
        PerformanceObserver: 'readonly',
        PerformanceResourceTiming: 'readonly',
        PerformanceEntry: 'readonly',
        CacheStorage: 'readonly',
        Performance: 'readonly',
        Console: 'readonly',
        ServiceWorker: 'readonly',
        Request: 'readonly',
        Transferable: 'readonly',
        OffscreenCanvas: 'readonly',
        self: 'readonly',
        
        // Node globals
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        global: 'readonly',
        require: 'readonly',
        module: 'readonly',
        exports: 'readonly',
        NodeJS: 'readonly',
        
        // React
        React: 'readonly',
        
        // Test globals
        test: 'readonly',
        expect: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly'
      }
    },
    plugins: {
      '@typescript-eslint': tseslint
    },
    rules: {
      ...js.configs.recommended.rules,
      
      // Základné pravidlá
      'no-console': process.env.NODE_ENV === 'production' 
        ? ['error', { allow: ['warn', 'error'] }] 
        : 'off',
      'no-debugger': 'error',
      'no-case-declarations': 'error',
      'no-var': 'error',
      'prefer-const': 'error',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        ignoreRestSiblings: true
      }],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': ['error', {
        prefer: 'type-imports'
      }]
    }
  }
];
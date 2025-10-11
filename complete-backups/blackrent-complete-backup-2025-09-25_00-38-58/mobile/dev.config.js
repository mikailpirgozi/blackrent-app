// Development Configuration
// Tieto nastavenia zabezpečia stabilný hot reload

module.exports = {
  // Fast Refresh nastavenia
  fastRefresh: {
    enabled: true,
    // Zachová state pri hot reload
    preserveState: true,
    // Automaticky reloadne pri chybách
    autoReload: true,
  },

  // TypeScript nastavenia pre development
  typescript: {
    // Ignoruje TypeScript chyby počas vývoja
    ignoreBuildErrors: true,
    // Povolí any typy počas prototypovania
    strict: false,
  },

  // ESLint nastavenia pre development
  eslint: {
    // Ignoruje ESLint warnings počas vývoja
    ignoreDuringBuilds: true,
    // Zobrazí len errors, nie warnings
    emitWarning: false,
  },

  // Metro bundler optimalizácie
  metro: {
    // Cache pre rýchlejšie rebuildy
    enableCache: true,
    // Resetne cache len ak je potrebné
    resetCache: false,
    // Minifikácia vypnutá pre development
    minify: false,
  },

  // Platform-specific nastavenia
  platforms: {
    // Skipne web bundling ak vyvíjaš mobile
    skipWeb: true,
    // Default platform
    defaultPlatform: 'ios',
  },

  // Hot reload exceptions
  hotReloadExceptions: [
    // Tieto súbory nevyvolajú reload
    'node_modules/**',
    '*.test.*',
    '*.spec.*',
  ],
};

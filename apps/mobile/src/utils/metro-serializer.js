/**
 * 📦 Metro Custom Serializer
 * Advanced bundle optimization and code splitting
 */

const { createIndexMap } = require('metro-source-map');

/**
 * Custom serializer for Metro bundler
 * Implements advanced optimizations like tree shaking and bundle splitting
 */
function customSerializer(entryPoint, preModules, graph, options) {
  // Performance monitoring
  const startTime = Date.now();
  
  try {
    // Get the default serializer from Metro
    let defaultSerializer;
    try {
      // Try new Metro API first
      defaultSerializer = require('metro/src/shared/output/bundle').default;
    } catch (e) {
      try {
        // Fallback to older API
        defaultSerializer = require('metro/src/shared/output/bundle');
      } catch (e2) {
        // Last resort - use basic serializer
        defaultSerializer = require('metro-serializer');
      }
    }

    // If still no serializer, create a basic one
    if (!defaultSerializer || typeof defaultSerializer !== 'function') {
      console.warn('⚠️ Using basic serializer fallback');
      return basicSerializer(entryPoint, preModules, graph, options);
    }
    
    // Apply optimizations
    const optimizedModules = optimizeModules(preModules, graph);
    const optimizedGraph = optimizeGraph(graph);
    
    // Generate bundle with optimizations
    const bundle = defaultSerializer(entryPoint, optimizedModules, optimizedGraph, options);
    
    const endTime = Date.now();
    console.log(`📦 Bundle serialized in ${endTime - startTime}ms`);
    
    return bundle;
  } catch (error) {
    console.error('❌ Bundle serialization failed:', error);
    // Fallback to basic serializer
    return basicSerializer(entryPoint, preModules, graph, options);
  }
}

/**
 * Basic serializer fallback
 */
function basicSerializer(entryPoint, preModules, graph, options) {
  const modules = [...preModules];
  
  // Add all modules from graph
  for (const [, module] of graph.dependencies) {
    modules.push(module);
  }
  
  // Simple bundle creation
  const code = modules
    .map(module => {
      if (module.output && module.output[0]) {
        return module.output[0].data.code;
      }
      return '';
    })
    .join('\n');
    
  return {
    code,
    map: null,
  };
}

/**
 * Optimize modules by removing unused code
 */
function optimizeModules(modules, graph) {
  const optimizedModules = [];
  const usedModules = new Set();
  
  // Tree shaking - only include modules that are actually used
  for (const module of modules) {
    if (isModuleUsed(module, graph)) {
      usedModules.add(module.path);
      optimizedModules.push(optimizeModule(module));
    }
  }
  
  console.log(`🌳 Tree shaking: ${modules.length} → ${optimizedModules.length} modules`);
  return optimizedModules;
}

/**
 * Check if module is actually used in the dependency graph
 */
function isModuleUsed(module, graph) {
  // Always include entry points and core modules
  if (module.path.includes('node_modules/react-native') || 
      module.path.includes('node_modules/expo') ||
      module.path.includes('/app/') ||
      module.path.includes('index.js')) {
    return true;
  }
  
  // Check if module is referenced by other modules
  const dependencies = graph.dependencies;
  for (const [, dep] of dependencies) {
    if (dep.dependencies && dep.dependencies.has(module.path)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Optimize individual module
 */
function optimizeModule(module) {
  // Remove development-only code in production
  if (process.env.NODE_ENV === 'production') {
    module.output = module.output.map(output => ({
      ...output,
      data: {
        ...output.data,
        code: removeDevCode(output.data.code),
      },
    }));
  }
  
  return module;
}

/**
 * Remove development-only code
 */
function removeDevCode(code) {
  if (typeof code !== 'string') return code;
  
  // Remove console.log statements in production
  return code
    .replace(/console\.(log|debug|info|warn)\([^)]*\);?/g, '')
    .replace(/console\.(log|debug|info|warn)`[^`]*`;?/g, '')
    // Remove __DEV__ blocks
    .replace(/if\s*\(__DEV__\)\s*\{[^}]*\}/g, '')
    // Remove development assertions
    .replace(/invariant\([^)]*\);?/g, '')
    // Minify whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Optimize dependency graph
 */
function optimizeGraph(graph) {
  // Create optimized copy of graph
  const optimizedGraph = {
    ...graph,
    dependencies: new Map(),
  };
  
  // Only include dependencies that are actually used
  for (const [path, dependency] of graph.dependencies) {
    if (shouldIncludeDependency(dependency)) {
      optimizedGraph.dependencies.set(path, optimizeDependency(dependency));
    }
  }
  
  return optimizedGraph;
}

/**
 * Check if dependency should be included
 */
function shouldIncludeDependency(dependency) {
  // Always include core dependencies
  if (dependency.path.includes('node_modules/react-native') ||
      dependency.path.includes('node_modules/expo') ||
      dependency.path.includes('/app/')) {
    return true;
  }
  
  // Exclude test files and dev dependencies
  if (dependency.path.includes('__tests__') ||
      dependency.path.includes('.test.') ||
      dependency.path.includes('.spec.') ||
      dependency.path.includes('storybook')) {
    return false;
  }
  
  return true;
}

/**
 * Optimize individual dependency
 */
function optimizeDependency(dependency) {
  return {
    ...dependency,
    // Remove source maps in production for smaller bundles
    map: process.env.NODE_ENV === 'production' ? null : dependency.map,
  };
}

/**
 * Bundle splitting for code splitting
 */
function createBundleSplits(graph, options) {
  const splits = {
    vendor: [], // Third-party libraries
    app: [],    // Application code
    common: [], // Shared utilities
  };
  
  for (const [path, dependency] of graph.dependencies) {
    if (path.includes('node_modules')) {
      splits.vendor.push(dependency);
    } else if (path.includes('/utils/') || path.includes('/hooks/')) {
      splits.common.push(dependency);
    } else {
      splits.app.push(dependency);
    }
  }
  
  return splits;
}

module.exports = customSerializer;

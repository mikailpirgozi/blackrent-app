/* eslint-env node */
/* eslint-disable no-undef */
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// Monorepo konfigurácia
const projectRoot = process.cwd();
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Monorepo watchFolders - Metro bude sledovať zmeny v celom workspace
config.watchFolders = [workspaceRoot];

// SVG support + PNG/JPG/WEBP assets
const { transformer, resolver } = config;
config.transformer = {
  ...transformer,
  babelTransformerPath: require.resolve('react-native-svg-transformer'),
};

config.resolver = {
  ...resolver,
  assetExts: [...resolver.assetExts.filter((ext) => ext !== 'svg'), 'png', 'jpg', 'jpeg', 'webp', 'gif'],
  sourceExts: [...resolver.sourceExts, 'svg'],
  // Monorepo nodeModulesPaths - Metro bude hľadať závislosti v workspace root
  nodeModulesPaths: [
    path.resolve(projectRoot, 'node_modules'),
    path.resolve(workspaceRoot, 'node_modules'),
  ],
  // Block native-only modules on web and test files
  blockList: [
    /node_modules\/@stripe\/stripe-react-native\/.*\.js$/,
    /__tests__\/.*/,
    /.*\.test\.(ts|tsx|js|jsx)$/,
    /.*\.spec\.(ts|tsx|js|jsx)$/,
  ],
};

module.exports = config;


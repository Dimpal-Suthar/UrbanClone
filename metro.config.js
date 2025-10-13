const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Fix for React Native "Cannot assign to read-only property 'NONE'" error
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Add source extensions for better module resolution
config.resolver.sourceExts = [...config.resolver.sourceExts, 'cjs', 'mjs'];

// Enable Hermes transformer optimizations
config.transformer = {
  ...config.transformer,
  getTransformOptions: async () => ({
    transform: {
      experimentalImportSupport: false,
      inlineRequires: true,
    },
  }),
};

module.exports = withNativeWind(config, { input: './global.css' });


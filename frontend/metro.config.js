const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.alias = {
  '@app': './src',
  '@theme': './src/theme',
  '@navigation': './src/navigation',
  '@hooks': './src/hooks',
  '@screens': './src/screens',
  '@components': './src/components',
  '@forms': './src/forms',
  '@services': './src/services',
};

module.exports = config;

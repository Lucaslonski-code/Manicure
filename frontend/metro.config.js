const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.alias = {
  '@app': './src',
  '@theme': './src/theme',
  '@navigation': './src/navigation',
};

module.exports = config;

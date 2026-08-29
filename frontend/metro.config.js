const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');
const fs = require('fs');

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

const audioDir = path.join(__dirname, 'src', 'assets', 'audio');
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.includes('/assets/audio/') && moduleName.endsWith('.mp3')) {
    const filePath = path.join(audioDir, path.basename(moduleName));
    if (!fs.existsSync(filePath)) {
      return {
        filePath: path.join(__dirname, 'src', 'services', 'audioStub.js'),
        type: 'sourceFile',
      };
    }
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;

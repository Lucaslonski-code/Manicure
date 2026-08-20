module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'react-native-reanimated/plugin',
      [
        'module-resolver',
        {
          root: ['./src'],
          alias: {
            '@app': './src',
            '@theme': './src/theme',
            '@navigation': './src/navigation',
            '@hooks': './src/hooks',
            '@screens': './src/screens',
            '@components': './src/components',
            '@forms': './src/forms',
            '@services': './src/services',
          },
        },
      ],
    ],
  };
};

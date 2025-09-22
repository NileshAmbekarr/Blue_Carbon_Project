module.exports = {
  presets: ['module:metro-react-native-babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./src'],
        alias: {
          '@': './src',
          '@components': './src/components',
          '@screens': './src/screens',
          '@services': './src/services',
          '@utils': './src/utils',
          '@store': './src/store',
          '@types': './src/types',
          '@navigation': './src/navigation',
          '@hooks': './src/hooks',
        },
      },
    ],
    'react-native-reanimated/plugin',
  ],
};

module.exports = function(api) {
  api.cache(false);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module:react-native-dotenv',
        {
          moduleName: 'react-native-dotenv',
          verbose: false,
        },
      ],
      ['@babel/plugin-transform-react-jsx', {
        runtime: 'automatic'
      }], 
      'react-native-reanimated/plugin', 
    ],
  };
};
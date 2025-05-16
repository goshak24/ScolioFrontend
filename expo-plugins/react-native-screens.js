module.exports = function withRNSScreens(config) {
    return {
      ...config,
      plugins: [
        ...config.plugins,
        [
          "react-native-screens",
          {
            android_onCreate_null: true, 
          },
        ],
      ],
    };
  };
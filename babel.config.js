module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    plugins: [
      ["@babel/plugin-proposal-decorators", { legacy: true }],
      // Apply loose mode ONLY to non-react-native-maps files via override below
      // "react-native-reanimated/plugin", // Temporarily disabled due to worklets dependency
    ],
    overrides: [
      {
        // Apply loose mode ONLY to app code (NOT react-native-maps)
        // This fixes the getNativeComponent bug by keeping react-native-maps in strict mode
        test: (file) => file && !file.includes('node_modules/react-native-maps'),
        plugins: [
          ["@babel/plugin-proposal-class-properties", { loose: true }],
        ],
      },
    ],
  };
};
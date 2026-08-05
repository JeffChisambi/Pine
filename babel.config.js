module.exports = function (api) {
  api.cache(true);
  return {
    presets: [["babel-preset-expo", { unstable_transformImportMeta: true }]],
    // VisionCamera frame processors run in worklets. This plugin must run
    // BEFORE babel-preset-expo's reanimated worklet transform — plugins run
    // before presets, so listing it here gives the correct order.
    plugins: ["react-native-worklets-core/plugin"],
  };
};

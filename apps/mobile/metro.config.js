const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

// Expo SDK 52+ detecta monorepos npm workspaces automaticamente (watchFolders/
// nodeModulesPaths/symlinks) quando usa expo/metro-config a partir da raiz do
// app - packages/shared resolve sem configuracao manual extra.
const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, { input: "./src/global.css" });

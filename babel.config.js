export default {
  presets: [
    ["@babel/preset-env", { targets: "defaults", modules: false }],
    "@babel/preset-typescript",
  ],
  plugins: [
    "babel-plugin-ui5-esm",
    ["@babel/plugin-proposal-decorators", { version: "2023-05" }],
  ],
};

const { NxAppWebpackPlugin } = require('@nx/webpack/app-plugin');

module.exports = {
  watch: process.env.WEBPACK_WATCH === 'true',
  plugins: [
    new NxAppWebpackPlugin({
      target: 'node',
      compiler: 'tsc',
      main: './src/main.ts',
      tsConfig: './tsconfig.app.json',
      assets: ['./src/assets'],
      optimization: false,
      outputHashing: 'none',
      generatePackageJson: true,
      watch: process.env.WEBPACK_WATCH === 'true',
    }),
  ],
};

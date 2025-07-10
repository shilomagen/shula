const { NxAppWebpackPlugin } = require('@nx/webpack/app-plugin');
const { sentryWebpackPlugin } = require("@sentry/webpack-plugin");

module.exports = (config, context) => {
  // Default to watch mode in development environment
  const plugins = [];
  if (process.env.NODE_ENV === 'production') {
    plugins.push(
      sentryWebpackPlugin({
        authToken: process.env.SENTRY_AUTH_TOKEN,
        org: 'moments-f1',
        project: 'shula-backend',
      })
    );
  }
  return {
    plugins: [
      ...plugins,
      new NxAppWebpackPlugin({
        target: 'node',
        compiler: 'tsc',
        main: './src/main.ts',
        tsConfig: './tsconfig.app.json',
        assets: [
          './src/assets',
          {
          input: 'apps/backend/prisma',
          glob: '**/*.prisma',
          output: 'prisma',
        }],
        optimization: process.env.NODE_ENV === 'production',
        outputHashing: 'none',
        generatePackageJson: true,
        watch: process.env.WEBPACK_WATCH === 'true' || process.env.NODE_ENV === 'development',
      }),
    ],
  };
};

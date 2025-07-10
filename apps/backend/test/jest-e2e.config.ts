/* eslint-disable */
import { readFileSync } from 'fs';

// Reading the SWC compilation config for the test files
const swcJestConfig = JSON.parse(
  readFileSync(`${__dirname}/../.spec.swcrc`, 'utf-8')
);

// Disable .swcrc look-up by SWC core because we're passing in swcJestConfig ourselves
swcJestConfig.swcrc = false;

module.exports = {
  displayName: 'backend-e2e',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['@swc/jest', swcJestConfig],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../test-output/jest-e2e/coverage',
  testMatch: ['**/e2e/**/*.e2e.test.ts'],
  rootDir: '../',
  setupFilesAfterEnv: ['<rootDir>/test/jest-setup.ts'],
};

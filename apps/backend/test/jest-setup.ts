// Load env variables from test environment
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(__dirname, '../.test.e2e.env') });

// Set longer timeout for e2e tests
jest.setTimeout(30000);

// Mock console.error to prevent noisy error logs during tests
// but still log them when not in CI
if (process.env.CI) {
  global.console.error = jest.fn();
}

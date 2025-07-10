import { LANGFUSE_CLIENT } from '../../src/modules/conversations/engines/graph/providers';
import { MockLangfuse } from './third-party/langfuse.mock';
import { Provider } from '@nestjs/common';

/**
 * A factory for creating all the mock providers needed for testing
 */
export class MockFactory {
  /**
   * Get all mock providers for testing
   * @returns Object with mapping of providers to their mock implementations
   */
  static getMocks(): Record<string | symbol, any> {
    const mockProviders: Record<string | symbol, any> = {
      [LANGFUSE_CLIENT]: new MockLangfuse(),
      // Add other mock providers here as needed
    };

    return mockProviders;
  }

  /**
   * Get a specific mock by token
   * @param token The injection token
   * @returns The mock instance
   */
  static getMock(token: string | symbol): any {
    const mocks = this.getMocks();
    if (token in mocks) {
      return mocks[token];
    }
    throw new Error(`Mock for token ${String(token)} not found`);
  }
}

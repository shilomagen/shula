import { Provider } from '@nestjs/common';
import { LANGFUSE_CLIENT } from '../../../src/modules/conversations/engines/graph/providers';

/**
 * Mock implementation of Langfuse client
 */
export class MockLangfuse {
  // Mock trace method
  trace(name: string, metadata?: Record<string, any>) {
    return {
      update: jest.fn(),
      end: jest.fn(),
      generation: jest.fn(() => ({
        end: jest.fn(),
      })),
      event: jest.fn(),
      span: jest.fn(() => ({
        end: jest.fn(),
      })),
    };
  }

  // Mock generation method
  generation(params: any) {
    return {
      update: jest.fn(),
      end: jest.fn(),
    };
  }

  // Mock scoreEvent method
  scoreEvent(params: any) {
    return jest.fn();
  }

  // Any other methods that might be used in your application
}

/**
 * Provider for mock Langfuse client
 */
export const MockLangfuseProvider: Provider = {
  provide: LANGFUSE_CLIENT,
  useFactory: () => {
    return new MockLangfuse();
  },
};

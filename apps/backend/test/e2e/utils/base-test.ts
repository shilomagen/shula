import { INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import { PrismaService } from '../../../src/database/prisma.service';
import { DatabaseCleaner } from '../../utils/database-cleaner';
import { TestContext, createTestApp } from './test-app';

/**
 * Base test class for e2e tests
 * Provides common setup and teardown functions
 */
export class BaseTest {
  protected app!: INestApplication;
  protected moduleRef!: TestingModule;
  protected prisma!: PrismaService;
  protected databaseCleaner!: DatabaseCleaner;

  /**
   * Setup function to be called in beforeAll
   */
  async setup(): Promise<void> {
    const testContext: TestContext = await createTestApp();
    this.app = testContext.app;
    this.moduleRef = testContext.moduleRef;
    this.databaseCleaner = testContext.databaseCleaner;
    this.prisma = this.moduleRef.get<PrismaService>(PrismaService);
    return new Promise((resolve) => {
      this.app.listen(process.env.PORT || 3000).then(() => {
        resolve();
      });
    });
  }

  /**
   * Teardown function to be called in afterAll
   */
  async teardown(): Promise<void> {
    await this.app.close();
  }

  /**
   * Clean database function to be called in afterEach
   */
  async cleanDatabase(): Promise<void> {
    if (this.databaseCleaner) {
      await this.databaseCleaner.cleanDatabase();
    }
  }

  /**
   * Get HTTP server
   */
  getHttpServer() {
    return this.app.getHttpServer();
  }

  /**
   * Get base URL for API clients
   */
  getUrl(): string {
    const server = this.app.getHttpServer();
    const address = server.address();

    if (!address) {
      throw new Error(
        'Server address not available. Make sure the server is listening.'
      );
    }

    // Check if address is a string (unix socket) or an object (TCP socket)
    if (typeof address === 'string') {
      return `http://${address}`;
    } else {
      return `http://localhost:${address.port}`;
    }
  }

  /**
   * Helper to create data in the database
   * @param callback Function that creates data using prisma
   * @returns Result of callback
   */
  async createTestData<T>(
    callback: (prisma: PrismaClient) => Promise<T>
  ): Promise<T> {
    return await callback(this.prisma);
  }

  /**
   * Generic database query helper
   * @param callback Function that performs a database query
   * @returns Result of callback
   */
  async query<T>(callback: (prisma: PrismaClient) => Promise<T>): Promise<T> {
    return await callback(this.prisma);
  }
}

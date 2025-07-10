import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import { ContextLogger } from 'nestjs-context-logger';
import { REDIS_CLIENT } from './redis.provider';
import { type RedisClientType } from 'redis';

/**
 * Service for caching operations using Redis
 */
@Injectable()
export class CacheService implements OnModuleDestroy {
  private readonly logger = new ContextLogger(CacheService.name);
  private isConnected = true; // Assume connection is established via provider

  constructor(@Inject(REDIS_CLIENT) private readonly redisClient: RedisClientType) {
    this.logger.log('CacheService initialized with injected Redis client');

    // Monitor connection status via event listeners
    this.redisClient.on('error', () => {
      this.isConnected = false;
      this.logger.error('Redis client connection error');
    });

    this.redisClient.on('ready', () => {
      this.isConnected = true;
      this.logger.log('Redis client connection ready');
    });

    this.redisClient.on('end', () => {
      this.isConnected = false;
      this.logger.log('Redis client connection ended');
    });
  }

  /**
   * NestJS lifecycle hook - clean up Redis connection when the module is destroyed
   */
  async onModuleDestroy(): Promise<void> {
    this.logger.log('Cleaning up Redis client connection');
    await this.closeRedisConnection();
  }

  /**
   * Close the Redis connection when the application shuts down
   */
  private async closeRedisConnection(): Promise<void> {
    if (this.redisClient) {
      try {
        await this.redisClient.quit();
        this.logger.log('Redis connection closed gracefully');
      } catch (error) {
        this.logger.error(
          `Error closing Redis connection: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
          { error }
        );
      } finally {
        this.isConnected = false;
      }
    }
  }

  /**
   * Helper method to ensure Redis connection is active before operations
   */
  private async ensureConnection(): Promise<void> {
    if (!this.isConnected) {
      try {
        this.logger.log('Redis client not connected, attempting to reconnect');
        await this.redisClient.connect();
        this.isConnected = true;
      } catch (error) {
        this.logger.error(
          `Failed to reconnect to Redis: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
          { error }
        );
        throw new Error('Redis connection unavailable');
      }
    }
  }

  /**
   * Set a key with a TTL
   * @param key - The key to set
   * @param value - The value to store
   * @param ttlSeconds - The time-to-live in seconds
   * @returns Promise<boolean> indicating success
   */
  async set(key: string, value: string, ttlSeconds: number): Promise<boolean> {
    try {
      await this.ensureConnection();
      await this.redisClient.set(key, value, {
        EX: ttlSeconds,
      });
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to set cache key ${key}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
        { error }
      );
      return false;
    }
  }

  /**
   * Get a value by key
   * @param key - The key to retrieve
   * @returns Promise<string | null> The stored value or null if not found
   */
  async get(key: string): Promise<string | null> {
    try {
      await this.ensureConnection();
      return await this.redisClient.get(key);
    } catch (error) {
      this.logger.error(
        `Failed to get cache key ${key}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
        { error }
      );
      return null;
    }
  }

  /**
   * Check if a key exists
   * @param key - The key to check
   * @returns Promise<boolean> True if the key exists, false otherwise
   */
  async exists(key: string): Promise<boolean> {
    try {
      await this.ensureConnection();
      const result = await this.redisClient.exists(key);
      return result === 1;
    } catch (error) {
      this.logger.error(
        `Failed to check existence of cache key ${key}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
        { error }
      );
      return false;
    }
  }

  /**
   * Set a key only if it doesn't already exist
   * @param key - The key to set
   * @param value - The value to store
   * @param ttlSeconds - The time-to-live in seconds
   * @returns Promise<boolean> True if the key was set, false if it already exists
   */
  async setNX(
    key: string,
    value: string,
    ttlSeconds: number
  ): Promise<boolean> {
    try {
      await this.ensureConnection();
      const result = await this.redisClient.setNX(key, value);
      if (result) {
        await this.redisClient.expire(key, ttlSeconds);
      }
      return result;
    } catch (error) {
      this.logger.error(
        `Failed to setNX cache key ${key}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
        { error }
      );
      return false;
    }
  }

  /**
   * Delete a key
   * @param key - The key to delete
   * @returns Promise<boolean> True if the key was deleted, false otherwise
   */
  async delete(key: string): Promise<boolean> {
    try {
      await this.ensureConnection();
      const result = await this.redisClient.del(key);
      return result === 1;
    } catch (error) {
      this.logger.error(
        `Failed to delete cache key ${key}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
        { error }
      );
      return false;
    }
  }

  /**
   * Get the connection status
   * @returns boolean indicating if the Redis connection is active
   */
  getConnectionStatus(): boolean {
    return this.isConnected;
  }
}

import { FactoryProvider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from 'redis';
import type { RedisClientType } from 'redis';
import { ContextLogger } from 'nestjs-context-logger';

export const REDIS_CLIENT = 'REDIS_CLIENT';

/**
 * Redis client provider for dependency injection
 * Creates and configures a shared Redis client instance
 */
export const RedisProvider: FactoryProvider<Promise<RedisClientType>> = {
  provide: REDIS_CLIENT,
  inject: [ConfigService],
  useFactory: async (
    configService: ConfigService
  ): Promise<RedisClientType> => {
    const logger = new ContextLogger('RedisProvider');
    logger.log('Initializing Redis client...');

    const client: RedisClientType = createClient({
      socket: {
        host: configService.get<string>('queue.redis.host', 'localhost'),
        port: configService.get<number>('queue.redis.port', 6379),
      },
    }) as RedisClientType;

    // Set up event handlers with proper logging
    client.on('error', (error) => {
      logger.error(`Redis client error: ${error.message}`, { error });
    });

    client.on('connect', () => {
      logger.log('Redis client connecting...');
    });

    client.on('ready', () => {
      logger.log('Redis client connected and ready');
    });

    client.on('reconnecting', () => {
      logger.log('Redis client reconnecting...');
    });

    client.on('end', () => {
      logger.log('Redis client connection closed');
    });

    // Connect to Redis
    await client.connect();
    logger.log('Redis client connected successfully');

    // Register a handler to properly close the connection on application shutdown
    process.on('beforeExit', async () => {
      logger.log('Application shutting down, closing Redis connection...');
      await client.quit().catch((err) =>
        logger.error(`Error closing Redis connection: ${err.message}`, {
          err,
        })
      );
    });

    return client;
  },
};

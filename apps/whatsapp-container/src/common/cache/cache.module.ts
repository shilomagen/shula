import { DynamicModule, Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CacheService } from './cache.service';
import { RedisProvider } from './redis.provider';

@Global()
@Module({})
export class CacheModule {
  static forRoot(): DynamicModule {
    return {
      module: CacheModule,
      imports: [ConfigModule],
      providers: [RedisProvider, CacheService],
      exports: [CacheService],
    };
  }
}

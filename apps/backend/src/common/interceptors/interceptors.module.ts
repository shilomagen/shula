import { Module, DynamicModule } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { RequestLoggerInterceptor } from './request-logger.interceptor';
import type { RequestLoggerConfig } from './request-logger.config';

@Module({
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: RequestLoggerInterceptor,
    },
  ],
})
export class InterceptorsModule {
  /**
   * Configure the RequestLoggerInterceptor with custom options
   * @param config Configuration options for the RequestLoggerInterceptor
   * @returns A dynamically configured module
   */
  static forRoot(config?: RequestLoggerConfig): DynamicModule {
    return {
      module: InterceptorsModule,
      providers: [
        {
          provide: APP_INTERCEPTOR,
          useFactory: () => new RequestLoggerInterceptor(config),
        },
      ],
    };
  }
}

import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ContextLoggerModule } from 'nestjs-context-logger';
import { OpenTelemetryModule } from 'nestjs-otel';
import { ConfigModule } from '../common/config/config.module';
import { QueueModule } from '../common/queue/queue.module';
import { WebhookModule } from '../modules/webhook/webhook.module';
import { WhatsAppModule } from '../modules/whatsapp/whatsapp.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CacheModule } from '../common/cache/cache.module';
@Module({
  imports: [
    ConfigModule,
    ScheduleModule.forRoot(),
    QueueModule.forRoot(),
    CacheModule.forRoot(),
    ContextLoggerModule.forRoot({
      pinoHttp: {
        level: 'info',
        transport:
          process.env.NODE_ENV !== 'production'
            ? { target: 'pino-pretty' }
            : undefined,
      },
      ignoreBootstrapLogs: true,
    }),
    OpenTelemetryModule.forRoot({
      metrics: {
        hostMetrics: true,
        apiMetrics: {
          enable: true,
          defaultAttributes: {
            service: 'shula-whatsapp-container',
          },
          ignoreRoutes: ['/health', '/favicon.ico'],
        },
      },
    }),
    WhatsAppModule,
    WebhookModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

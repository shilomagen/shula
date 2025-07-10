import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { SentryGlobalFilter, SentryModule } from '@sentry/nestjs/setup';
import { MetricsModule } from '@shula/observability';
import { ContextLoggerModule } from 'nestjs-context-logger';
import { ConfigModule } from '../common/config/config.module';
import { QueueModule } from '../common/queue';
import { PrismaModule } from '../database/prisma.module';
import { FaceRecognitionQueueModule } from '../modules/face-recognition/queues/face-recognition-queue.module';
import { GroupsModule } from '../modules/groups/groups.module';
import { ParticipantsModule } from '../modules/participants/participants.module';
import { PersonsModule } from '../modules/persons/persons.module';
import { SystemMessagesModule } from '../modules/system-messages/system-messages.module';
import { WhatsAppStatusModule } from '../modules/whatsapp-status/whatsapp-status.module';
import { WhatsappQueueModule } from '../modules/whatsapp/queues/whatsapp-queue.module';
import { WhatsAppModule } from '../modules/whatsapp/whatsapp.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
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
    SentryModule.forRoot(),
    ConfigModule,
    PrismaModule,
    QueueModule.forRoot(),
    MetricsModule,
    GroupsModule,
    ParticipantsModule,
    PersonsModule,
    WhatsAppModule,
    WhatsappQueueModule,
    WhatsAppStatusModule,
    FaceRecognitionQueueModule,
    SystemMessagesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: SentryGlobalFilter,
    },
  ],
})
export class AppModule {}

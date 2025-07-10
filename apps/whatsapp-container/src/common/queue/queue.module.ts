import { BullModule } from '@smangam/bullmq';
import { DynamicModule, Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullMQOtel } from 'bullmq-otel';
@Global()
@Module({})
export class QueueModule {
  static forRoot(): DynamicModule {
    return {
      module: QueueModule,
      imports: [
        BullModule.forRootAsync({
          imports: [ConfigModule],
          useFactory: (configService: ConfigService) => ({
            connection: {
              host: configService.get<string>('queue.redis.host'),
              port: configService.get<number>('queue.redis.port'),
            },
            telemetry: new BullMQOtel('whatsapp-container'),
            defaultJobOptions: configService.get('queue.defaultJobOptions'),
          }),
          inject: [ConfigService],
        }),
      ],
      exports: [BullModule],
    };
  }

  static registerQueue(queueName: string): DynamicModule {
    return {
      module: QueueModule,
      imports: [
        BullModule.registerQueue({
          name: queueName,
        }),
      ],
      exports: [BullModule],
    };
  }
}

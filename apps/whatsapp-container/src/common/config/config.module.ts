import { Module, Global } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { queueConfig } from './queue.config';
import s3Config from '../../config/s3.config';
import backendConfig from '../../config/backend.config';
@Global()
@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      load: [queueConfig, s3Config, backendConfig],
    }),
  ],
})
export class ConfigModule {}

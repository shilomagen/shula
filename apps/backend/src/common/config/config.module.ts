import { Module, Global } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { queueConfig } from './queue.config';
import { whatsappConfig } from './whatsapp.config';
import { shulaConfig } from './shula.config';

@Global()
@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [queueConfig, whatsappConfig, shulaConfig],
    }),
  ],
})
export class ConfigModule {}

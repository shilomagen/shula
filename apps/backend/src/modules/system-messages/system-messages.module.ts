import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { SystemMessagesController } from './system-messages.controller';
import { SystemMessagesMapper } from './system-messages.mapper';
import { SystemMessagesService } from './system-messages.service';

@Module({
  imports: [PrismaModule],
  controllers: [SystemMessagesController],
  providers: [SystemMessagesService, SystemMessagesMapper],
  exports: [SystemMessagesService],
})
export class SystemMessagesModule {}

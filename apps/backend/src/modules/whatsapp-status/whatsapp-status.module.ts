import { Module } from '@nestjs/common';
import { WhatsAppStatusController } from './whatsapp-status.controller';
import { WhatsAppStatusService } from './whatsapp-status.service';
import { WhatsAppStatusMapper } from './whatsapp-status.mapper';
import { PrismaModule } from '../../database/prisma.module';
import { WhatsAppStatusQueueModule } from './queues/whatsapp-status-queue.module';

@Module({
  imports: [PrismaModule, WhatsAppStatusQueueModule],
  controllers: [WhatsAppStatusController],
  providers: [WhatsAppStatusService, WhatsAppStatusMapper],
  exports: [WhatsAppStatusService],
})
export class WhatsAppStatusModule {}

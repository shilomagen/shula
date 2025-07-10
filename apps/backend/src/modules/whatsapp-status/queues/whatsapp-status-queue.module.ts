import { BullModule } from '@smangam/bullmq';
import { Module } from '@nestjs/common';
import { QUEUE_NAMES } from '@shula/shared-queues';
import { PrismaModule } from '../../../database/prisma.module';
import { WhatsAppStatusProcessor } from './whatsapp-status.processor';
import { WhatsAppStatusService } from '../whatsapp-status.service';
import { WhatsAppStatusMapper } from '../whatsapp-status.mapper';

@Module({
  imports: [
    BullModule.registerQueue({
      name: QUEUE_NAMES.WHATSAPP_STATUS,
    }),
    PrismaModule,
  ],
  providers: [
    WhatsAppStatusProcessor,
    WhatsAppStatusService,
    WhatsAppStatusMapper,
  ],
  exports: [],
})
export class WhatsAppStatusQueueModule {}

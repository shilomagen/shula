import { Module } from '@nestjs/common';
import { BullModule } from '@smangam/bullmq';
import { QUEUE_NAMES } from '@shula/shared-queues';
import { OutboundMessageService } from './services/outbound-message.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: QUEUE_NAMES.OUTBOUND_MESSAGE,
    }),
  ],
  providers: [OutboundMessageService],
  exports: [OutboundMessageService],
})
export class OutboundMessagesModule {}

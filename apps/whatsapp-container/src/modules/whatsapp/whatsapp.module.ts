import { BullModule } from '@smangam/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { QUEUE_NAMES } from '@shula/shared-queues';
import { QueueName } from '../../common/queue/queue.constants';
import { GroupHandlersService } from './handlers/group-handlers.service';
import { MessageHandlersService } from './handlers/message-handlers.service';
import { OutboundMessageProcessor } from './processors/outbound-message.processor';
import { GroupEventsQueueService } from './queues/group-events.queue';
import { MessageEventsQueueService } from './queues/message-events.queue';
import { MessageReactionsQueueService } from './queues/message-reactions.queue';
import { PollEventsQueueService } from './queues/poll-events.queue';
import { GroupSyncThrottlerService } from './services/group-sync-throttler.service';
import { WhatsAppStatusQueueService } from './queues/whatsapp-status.queue';
import { WhatsAppController } from './whatsapp.controller';
import { WhatsAppService } from './whatsapp.service';

@Module({
  imports: [
    ConfigModule,
    BullModule.registerQueue(
      {
        name: QueueName.WHATSAPP_CONNECTION,
      },
      {
        name: QUEUE_NAMES.GROUP_MANAGEMENT,
      },
      {
        name: QUEUE_NAMES.MESSAGE_PROCESSING,
      },
      {
        name: QUEUE_NAMES.OUTBOUND_MESSAGE,
      },
      {
        name: QUEUE_NAMES.WHATSAPP_STATUS,
      },
      {
        name: QUEUE_NAMES.POLL_EVENTS,
      },
      {
        name: QUEUE_NAMES.MESSAGE_REACTIONS,
      }
    ),
  ],

  controllers: [WhatsAppController],
  providers: [
    WhatsAppService,
    WhatsAppStatusQueueService,
    GroupEventsQueueService,
    GroupHandlersService,
    MessageEventsQueueService,
    MessageHandlersService,
    PollEventsQueueService,
    OutboundMessageProcessor,
    MessageReactionsQueueService,
    GroupSyncThrottlerService,
  ],
  exports: [WhatsAppService],
})
export class WhatsAppModule {}

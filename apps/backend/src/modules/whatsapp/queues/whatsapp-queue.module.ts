import { BullModule } from '@smangam/bullmq';
import { Module } from '@nestjs/common';
import { QUEUE_NAMES } from '@shula/shared-queues';
import { ConversationsModule } from '../../conversations/conversations.module';
import { ParticipantsModule } from '../../participants/participants.module';
import { GroupsModule } from '../../groups/groups.module';
import { GroupMetricsModule } from '../../group-metrics/group-metrics.module';
import { FaceRecognitionQueueModule } from '../../face-recognition/queues/face-recognition-queue.module';
import { WhatsAppMessagesProcessor } from './whatsapp-messages.processor';
import { DelayedResponseProcessor } from './delayed-response.processor';
import { ReactionProcessor } from './reaction-processor';
import { S3Module } from '../../../common/services/s3/s3.module';
import { QueueName } from '../../../common/queue/queue.constants';
import { ParticipantConsentsModule } from '../../participant-consents/participant-consents.module';
import { SystemMessagesModule } from '../../system-messages/system-messages.module';

@Module({
  imports: [
    BullModule.registerQueue(
      {
        name: QUEUE_NAMES.MESSAGE_PROCESSING,
      },
      {
        name: QueueName.DELAYED_RESPONSE,
      },
      {
        name: QUEUE_NAMES.POLL_EVENTS,
      },
      {
        name: QUEUE_NAMES.MESSAGE_REACTIONS,
      }
    ),
    ConversationsModule,
    ParticipantsModule,
    GroupsModule,
    GroupMetricsModule,
    FaceRecognitionQueueModule,
    ParticipantConsentsModule,
    S3Module,
    SystemMessagesModule,
  ],
  providers: [
    WhatsAppMessagesProcessor,
    DelayedResponseProcessor,
    ReactionProcessor,
  ],
})
export class WhatsappQueueModule {}

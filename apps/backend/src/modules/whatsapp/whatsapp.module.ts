import { BullModule } from '@smangam/bullmq';
import { Module } from '@nestjs/common';
import { QUEUE_NAMES } from '@shula/shared-queues';
import { GroupMessagesModule } from '../group-messages/group-messages.module';
import { GroupsModule } from '../groups/groups.module';
import { ParticipantConsentsModule } from '../participant-consents/participant-consents.module';
import { ParticipantsModule } from '../participants/participants.module';
import { ReactionProcessor } from './queues/reaction-processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: QUEUE_NAMES.POLL_EVENTS,
    }),
    BullModule.registerQueue({
      name: QUEUE_NAMES.MESSAGE_REACTIONS,
    }),
    GroupsModule,
    ParticipantsModule,
    ParticipantConsentsModule,
    GroupMessagesModule,
  ],
  providers: [ReactionProcessor],
  exports: [],
})
export class WhatsAppModule {}

import { BullModule } from '@smangam/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { QUEUE_NAMES } from '@shula/shared-queues';
import { ProcessorName, QueueName } from '../../common/queue/queue.constants';
import { GroupMessagesModule } from '../group-messages/group-messages.module';
import { ParticipantConsentsModule } from '../participant-consents/participant-consents.module';
import { ParticipantsModule } from '../participants/participants.module';
import { GroupRemovalFlowService } from './flows/group-removal-flow.service';
import { GroupEventsProcessor } from './group-events.processor';
import { GroupsController } from './groups.controller';
import { GroupsMapper } from './groups.mapper';
import { GroupsService } from './groups.service';
import { GroupAdminEventHandler } from './handlers/group-admin-event.handler';
import { GroupJoinEventHandler } from './handlers/group-join-event.handler';
import { GroupLeaveEventHandler } from './handlers/group-leave-event.handler';
import { GroupParticipantsSyncEventHandler } from './handlers/group-participants-sync-event.handler';
import { GroupRemovalProcessor } from './processors/group-removal.processor';

@Module({
  imports: [
    ConfigModule,
    ParticipantsModule,
    BullModule.registerQueue(
      {
        name: QUEUE_NAMES.GROUP_MANAGEMENT,
      },
      {
        name: QueueName.PARTICIPANT_OPERATIONS,
      },
      {
        name: QueueName.GROUP_REMOVAL,
      }
    ),
    BullModule.registerFlowProducer({
      name: QueueName.GROUP_REMOVAL,
    }),
    GroupMessagesModule,
    ParticipantConsentsModule,
  ],
  controllers: [GroupsController],
  providers: [
    GroupsService,
    GroupsMapper,
    GroupEventsProcessor,
    GroupJoinEventHandler,
    GroupLeaveEventHandler,
    GroupAdminEventHandler,
    GroupParticipantsSyncEventHandler,
    GroupRemovalFlowService,
    {
      provide: ProcessorName.REMOVE_GROUP,
      useClass: GroupRemovalProcessor,
    },
  ],
  exports: [GroupsService, GroupLeaveEventHandler],
})
export class GroupsModule {}

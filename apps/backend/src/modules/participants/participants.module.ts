import { BullModule } from '@smangam/bullmq';
import { Module } from '@nestjs/common';
import { QueueName } from '../../common/queue/queue.constants';
import { PrismaModule } from '../../database/prisma.module';
import { GroupParticipantsModule } from '../group-participants/group-participants.module';
import { PersonsModule } from '../persons/persons.module';
import { ParticipantsController } from './participants.controller';
import { ParticipantsMapper } from './participants.mapper';
import { ParticipantsService } from './participants.service';
import { ParticipantRemovalProcessor } from './queues/participant-removal.processor';

@Module({
  imports: [
    GroupParticipantsModule,
    PersonsModule,
    PrismaModule,
    BullModule.registerQueue({
      name: QueueName.PARTICIPANT_OPERATIONS,
    }),
  ],
  controllers: [ParticipantsController],
  providers: [
    ParticipantsService,
    ParticipantsMapper,
    ParticipantRemovalProcessor,
  ],
  exports: [ParticipantsService, ParticipantsMapper],
})
export class ParticipantsModule {}

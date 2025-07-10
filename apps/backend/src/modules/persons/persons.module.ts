import { Module } from '@nestjs/common';
import { BullModule } from '@smangam/bullmq';
import { QUEUE_NAMES } from '@shula/shared-queues';
import { FaceRecognitionModule } from '../face-recognition/face-recognition.module';
import { PersonSideEffectsProcessor } from './queues/person-side-effects.processor';
import { PersonSideEffectsFlowService } from './queues/person-side-effects-flow.service';
import { PersonsService } from './persons.service';
import { PersonsMapper } from './persons.mapper';
import { PersonsController } from './persons.controller';
import { PrismaModule } from '../../database/prisma.module';

@Module({
  imports: [
    PrismaModule,
    FaceRecognitionModule,
    BullModule.registerQueue({
      name: QUEUE_NAMES.PERSONS,
    }),
    BullModule.registerFlowProducer({
      name: QUEUE_NAMES.PERSONS,
    }),
  ],
  controllers: [PersonsController],
  providers: [
    PersonsService,
    PersonsMapper,
    PersonSideEffectsProcessor,
    PersonSideEffectsFlowService,
  ],
  exports: [PersonsService],
})
export class PersonsModule {}

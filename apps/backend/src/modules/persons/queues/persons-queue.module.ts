import { BullModule } from '@smangam/bullmq';
import { Module } from '@nestjs/common';
import { QUEUE_NAMES } from '@shula/shared-queues';
import { FaceRecognitionModule } from '../../face-recognition/face-recognition.module';
import { PersonSideEffectsProcessor } from './person-side-effects.processor';
import { PersonSideEffectsFlowService } from './person-side-effects-flow.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: QUEUE_NAMES.PERSONS,
    }),
    BullModule.registerFlowProducer({
      name: QUEUE_NAMES.PERSONS,
    }),
    FaceRecognitionModule,
  ],
  providers: [PersonSideEffectsProcessor, PersonSideEffectsFlowService],
  exports: [PersonSideEffectsFlowService],
})
export class PersonsQueueModule {}

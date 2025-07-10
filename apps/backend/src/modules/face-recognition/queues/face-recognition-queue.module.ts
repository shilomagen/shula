import { Module } from '@nestjs/common';
import { QueueModule, QueueName } from '../../../common/queue';
import { OutboundMessagesModule } from '../../outbound-messages/outbound-messages.module';
import { ParticipantsModule } from '../../participants/participants.module';
import { FaceRecognitionModule } from '../face-recognition.module';
import { FaceRecognitionProcessor } from './processors/face-recognition.processor';
import { FaceRecognitionQueueService } from './services/face-recognition-queue.service';
import { GroupParticipantsModule } from '../../group-participants/group-participants.module';

/**
 * Module for face recognition queue functionality
 */
@Module({
  imports: [
    QueueModule.registerQueue(QueueName.FACE_RECOGNITION),
    FaceRecognitionModule,
    OutboundMessagesModule,
    GroupParticipantsModule,
    ParticipantsModule,
  ],
  providers: [FaceRecognitionProcessor, FaceRecognitionQueueService],
  exports: [FaceRecognitionQueueService],
})
export class FaceRecognitionQueueModule {}

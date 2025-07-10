import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GroupParticipantsModule } from '../group-participants/group-participants.module';
import { OutboundMessagesModule } from '../outbound-messages/outbound-messages.module';
import { FaceRecognitionController } from './face-recognition.controller';
import { RekognitionClientProvider } from './providers/rekognition-client.provider';
import { FaceRecognitionService } from './services/face-recognition.service';
import { ImageUtilsService } from './services/image-utils.service';
import { RekognitionService } from './services/rekognition.service';

/**
 * Main module for face recognition functionality
 */
@Module({
  imports: [ConfigModule, OutboundMessagesModule, GroupParticipantsModule],
  controllers: [FaceRecognitionController],
  providers: [
    FaceRecognitionService,
    RekognitionService,
    ImageUtilsService,
    RekognitionClientProvider,
  ],
  exports: [FaceRecognitionService, ImageUtilsService],
})
export class FaceRecognitionModule {}

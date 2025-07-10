import { InjectQueue } from '@smangam/bullmq';
import { Injectable } from '@nestjs/common';
import { ImageMessageMedia } from '@shula/shared-queues';
import { JobsOptions, Queue } from 'bullmq';
import { ContextLogger } from 'nestjs-context-logger';
import { ProcessorName, QueueName } from '../../../../common/queue';
import { FaceRecognitionJobData } from '../../interfaces/face-recognition.interfaces';

/**
 * Service for managing face recognition jobs in the queue
 */
@Injectable()
export class FaceRecognitionQueueService {
  private readonly logger = new ContextLogger(FaceRecognitionQueueService.name);

  constructor(
    @InjectQueue(QueueName.FACE_RECOGNITION)
    private readonly queue: Queue<FaceRecognitionJobData>
  ) {}

  /**
   * Add a face recognition job to the queue using image media
   * @param messageId The message ID
   * @param groupId The group ID
   * @param chatId The chat ID
   * @param imageMedia The image media data
   * @param senderPhoneNumber Optional phone number of the sender
   * @param options Optional job options
   * @returns The job ID
   */
  async queueFaceRecognitionWithImageMedia(
    messageId: string,
    groupId: string,
    chatId: string,
    imageMedia: ImageMessageMedia,
    senderPhoneNumber: string,
    options?: JobsOptions
  ): Promise<string> {
    this.logger.log(
      `Adding face recognition job with image media for message ${messageId} in group ${groupId}`
    );

    const jobData: FaceRecognitionJobData = {
      messageId,
      groupId,
      chatId,
      imageMedia,
      senderPhoneNumber,
    };

    await this.queue.add(ProcessorName.RECOGNIZE_FACES, jobData, options);
    return jobData.messageId;
  }
}

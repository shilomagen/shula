import { Injectable } from '@nestjs/common';
import { Processor, WorkerHost } from '@smangam/bullmq';
import { Job } from 'bullmq';
import { ContextLogger } from 'nestjs-context-logger';
import { ProcessorName, QueueName } from '../../../../common/queue';
import { GroupParticipantsService } from '../../../group-participants/group-participants.service';
import { OutboundMessageService } from '../../../outbound-messages/services/outbound-message.service';
import { ParticipantsService } from '../../../participants/participants.service';
import {
  FaceRecognitionJobData,
  FaceRecognitionResult,
  RecognizedPerson,
} from '../../interfaces/face-recognition.interfaces';
import { FaceRecognitionService } from '../../services/face-recognition.service';

/**
 * Processor for face recognition jobs
 */
@Injectable()
@Processor(QueueName.FACE_RECOGNITION, { concurrency: 50 })
export class FaceRecognitionProcessor extends WorkerHost {
  private readonly logger = new ContextLogger(ProcessorName.RECOGNIZE_FACES);

  constructor(
    private readonly faceRecognitionService: FaceRecognitionService,
    private readonly participantsService: ParticipantsService,
    private readonly groupParticipantsService: GroupParticipantsService,
    private readonly outboundMessageService: OutboundMessageService
  ) {
    super();
  }

  /**
   * Process a face recognition job
   * @param job The job containing the message and media data
   * @returns The face recognition result
   */
  async process(
    job: Job<FaceRecognitionJobData>
  ): Promise<FaceRecognitionResult> {
    this.logger.log(`Processing face recognition job: ${job.id}`, {
      senderPhoneNumber: job.data.senderPhoneNumber || 'unknown',
    });

    try {
      const { messageId, groupId, chatId, imageMedia } = job.data;

      // Log the job details
      this.logger.debug(`Face recognition job details`, {
        messageId,
        groupId,
        chatId,
      });

      // Determine which image data to use (prefer imageMedia over mediaUrl)
      const imageData = imageMedia;

      if (!imageData) {
        throw new Error('No image data provided in job');
      }

      // Use the face recognition service to recognize faces
      // The service now internally handles all the face detection logic
      const recognizedPersons =
        await this.faceRecognitionService.recognizeFaces(groupId, imageData);

      this.logger.log('Recognized persons', recognizedPersons);

      const personIds = recognizedPersons.map((person) => person.personId);
      this.logger.log(`Recognized person IDs: ${personIds.join(', ')}`);

      // Process all recognized persons in parallel
      const processedPersons = await Promise.all(
        recognizedPersons.map((person) =>
          this.processRecognizedPerson(person, groupId, imageData)
        )
      );

      return {
        messageId,
        groupId,
        recognizedPersons: processedPersons,
        success: true,
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Face recognition failed: ${errorMessage}`, {
        error,
      });

      return {
        messageId: job.data.messageId,
        groupId: job.data.groupId,
        recognizedPersons: [],
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Process a single recognized person
   * @param person The recognized person
   * @param groupId The group ID
   * @param imageData The image data
   * @returns The processed person with participant data
   */
  private async processRecognizedPerson(
    person: RecognizedPerson,
    groupId: string,
    imageData?: string | any
  ): Promise<RecognizedPerson & { participant?: any }> {
    try {
      const participant =
        await this.participantsService.findParticipantByPersonId(
          person.personId,
          groupId
        );

      if (!participant) {
        this.logger.warn(
          `Person ${person.personId} not found in group ${groupId} or has no participant`
        );
        return person;
      }

      // Check if the participant is in the group
      const isParticipantInGroup =
        await this.groupParticipantsService.isParticipantInGroup(
          participant.id,
          groupId
        );

      if (!isParticipantInGroup) {
        this.logger.warn(
          `Participant ${participant.id} is not in group ${groupId}`
        );
        return {
          ...person,
          participant,
        };
      }

      this.logger.log(
        `Recognized person ${person.personId} for participant ${participant.id}`,
        {
          participant,
          person,
        }
      );
      await this.outboundMessageService.sendMessage(
        participant.phoneNumber,
        '',
        typeof imageData === 'string' ? undefined : imageData
      );

      return {
        ...person,
        participant,
      };
    } catch (error) {
      this.logger.error(`Error processing person ${person.personId}:`, {
        error,
      });
      return person;
    }
  }

  /**
   * Handle job completion
   * @param job The completed job
   * @param result The result of the job
   */
  onCompleted(
    job: Job<FaceRecognitionJobData>,
    result: FaceRecognitionResult
  ): void {
    this.logger.debug(
      `Job ${job.id} completed with result: ${JSON.stringify(result)}`
    );
  }

  /**
   * Handle job failure
   * @param job The failed job
   * @param error The error that caused the failure
   */
  onFailed(job: Job<FaceRecognitionJobData>, error: Error): void {
    this.logger.error(`Job ${job.id} failed with error:`, { error });
  }
}

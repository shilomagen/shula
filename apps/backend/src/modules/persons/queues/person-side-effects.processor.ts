import { Processor, WorkerHost } from '@smangam/bullmq';
import {
  PERSON_PROCESSOR_NAMES,
  QUEUE_NAMES,
  WithContext,
} from '@shula/shared-queues';
import { Job } from 'bullmq';
import { ContextLogger } from 'nestjs-context-logger';
import { FaceRecognitionService } from '../../face-recognition/services/face-recognition.service';
import {
  DeleteFacesJobData,
  DeleteFacesResult,
  DeletePersonJobData,
  DeletePersonResult,
} from './person-side-effects.types';

interface FlowResult {
  success: boolean;
  userDeleted: boolean;
  facesDeleted: boolean;
}

@Processor(QUEUE_NAMES.PERSONS, { concurrency: 50 })
export class PersonSideEffectsProcessor extends WorkerHost {
  private readonly logger = new ContextLogger(PersonSideEffectsProcessor.name);

  constructor(private readonly faceRecognitionService: FaceRecognitionService) {
    super();
  }

  /**
   * Process a person deletion flow
   * @param job The parent flow job
   * @returns The aggregated result of child jobs
   */
  @WithContext()
  async process(job: Job): Promise<FlowResult> {
    // Only process the parent flow job
    if (job.name === PERSON_PROCESSOR_NAMES.DELETE_PERSON_FLOW) {
      this.logger.debug(`Processing person deletion flow: ${job.id}`);

      try {
        // Get results from child jobs
        const childrenValues = await job.getChildrenValues();
        const results = Object.values(childrenValues);

        // Extract results from child jobs
        const personResult = results.find(
          (r: any) => r.type === 'person'
        ) as DeletePersonResult & { type: string };
        const facesResult = results.find(
          (r: any) => r.type === 'faces'
        ) as DeleteFacesResult & { type: string };

        return {
          success: personResult?.success && facesResult?.success,
          userDeleted: personResult?.success || false,
          facesDeleted: facesResult?.success || false,
        };
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        this.logger.error(
          `Error processing person deletion flow: ${errorMessage}`
        );
        throw error;
      }
    }

    // Process delete person job
    if (job.name === PERSON_PROCESSOR_NAMES.DELETE_PERSON_REKOGNITION) {
      const result = await this.processDeletePerson(job);
      return {
        success: result.success,
        userDeleted: result.success,
        facesDeleted: false,
      };
    }

    // Process delete faces job
    if (job.name === PERSON_PROCESSOR_NAMES.DELETE_FACES_REKOGNITION) {
      const result = await this.processDeleteFaces(job);
      return {
        success: result.success,
        userDeleted: false,
        facesDeleted: result.success,
      };
    }

    throw new Error(`Unknown job name: ${job.name}`);
  }

  /**
   * Process a delete person job
   * @param job The job containing the person data
   * @returns The deletion result
   */
  private async processDeletePerson(
    job: Job<DeletePersonJobData>
  ): Promise<DeletePersonResult & { type: string }> {
    this.logger.debug(`Processing person deletion: ${job.id}`);

    try {
      const { personId, rekognitionCollectionId } = job.data;
      const result =
        await this.faceRecognitionService.deletePersonFromRekognition(
          rekognitionCollectionId,
          personId
        );

      return {
        ...result,
        type: 'person',
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error processing person deletion: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Process a delete faces job
   * @param job The job containing the faces data
   * @returns The deletion result
   */
  private async processDeleteFaces(
    job: Job<DeleteFacesJobData>
  ): Promise<DeleteFacesResult & { type: string }> {
    this.logger.debug(`Processing faces deletion: ${job.id}`);

    try {
      const { rekognitionCollectionId, faceIds } = job.data;
      const result =
        await this.faceRecognitionService.deleteFacesFromRekognition(
          rekognitionCollectionId,
          faceIds
        );

      return {
        ...result,
        type: 'faces',
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error processing faces deletion: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Handle job completion
   * @param job The completed job
   * @param result The result of the job
   */
  onCompleted(job: Job, result: FlowResult): void {
    if (job.name === PERSON_PROCESSOR_NAMES.DELETE_PERSON_FLOW) {
      this.logger.debug(
        `Flow ${job.id} completed with result: ` +
          `success=${result.success}, userDeleted=${result.userDeleted}, facesDeleted=${result.facesDeleted}`
      );

      // Log detailed audit information for the flow
      this.logger.log('Person deletion flow completed', {
        jobId: job.id,
        personId: job.data.personId,
        success: result.success,
        userDeleted: result.userDeleted,
        facesDeleted: result.facesDeleted,
        timestamp: new Date().toISOString(),
      });
    } else {
      this.logger.debug(
        `Job ${job.id} of type ${
          job.name
        } completed with result: ${JSON.stringify(result)}`
      );
    }
  }

  /**
   * Handle job failure
   * @param job The failed job
   * @param error The error that caused the failure
   */
  onFailed(job: Job, error: Error): void {
    this.logger.error(
      `Job ${job.id} of type ${job.name} failed with error: ${error.message}`,
      { error }
    );
  }
}

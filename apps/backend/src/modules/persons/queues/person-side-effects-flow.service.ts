import { InjectFlowProducer } from '@smangam/bullmq';
import { Injectable } from '@nestjs/common';
import { PERSON_PROCESSOR_NAMES, QUEUE_NAMES } from '@shula/shared-queues';
import { FlowProducer } from 'bullmq';
import { ContextLogger } from 'nestjs-context-logger';
import {
  DeleteFacesJobData,
  DeletePersonJobData,
  PersonSideEffectsFlowOptions,
} from './person-side-effects.types';

@Injectable()
export class PersonSideEffectsFlowService {
  private readonly logger = new ContextLogger(
    PersonSideEffectsFlowService.name
  );

  constructor(
    @InjectFlowProducer(QUEUE_NAMES.PERSONS)
    private readonly flowProducer: FlowProducer
  ) {}

  /**
   * Queue a person deletion flow
   * @param personId The ID of the person to delete
   * @param rekognitionCollectionId The AWS Rekognition collection ID
   * @param faceIds The face IDs to delete
   * @param options Optional job options
   * @returns The flow job ID
   * @throws Error if flow creation fails
   */
  async queuePersonDeletionFlow(
    personId: string,
    rekognitionCollectionId: string,
    faceIds: string[],
    options?: PersonSideEffectsFlowOptions
  ): Promise<string> {
    const defaultOptions: PersonSideEffectsFlowOptions = {
      attempts: 5,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
      removeOnComplete: true,
      removeOnFail: false,
      ...options,
    };

    // Create the flow with parent and child jobs
    const flow = await this.flowProducer.add({
      name: PERSON_PROCESSOR_NAMES.DELETE_PERSON_FLOW,
      queueName: QUEUE_NAMES.PERSONS,
      data: { personId, rekognitionCollectionId },
      opts: defaultOptions,
      children: [
        {
          name: PERSON_PROCESSOR_NAMES.DELETE_PERSON_REKOGNITION,
          data: {
            personId,
            rekognitionCollectionId,
          } as DeletePersonJobData,
          queueName: QUEUE_NAMES.PERSONS,
          opts: defaultOptions,
        },
        {
          name: PERSON_PROCESSOR_NAMES.DELETE_FACES_REKOGNITION,
          data: {
            personId,
            rekognitionCollectionId,
            faceIds,
          } as DeleteFacesJobData,
          queueName: QUEUE_NAMES.PERSONS,
          opts: defaultOptions,
        },
      ],
    });

    if (!flow.job.id) {
      throw new Error('Failed to create flow: No job ID returned');
    }

    this.logger.debug(
      `Created person deletion flow with ID ${flow.job.id} for person ${personId}`
    );

    return flow.job.id;
  }
}

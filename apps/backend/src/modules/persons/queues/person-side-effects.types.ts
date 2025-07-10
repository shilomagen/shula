import { JobsOptions } from 'bullmq';

/**
 * Base interface for person side effects job data
 */
interface BasePersonSideEffectsJobData {
  personId: string;
  rekognitionCollectionId: string;
}

/**
 * Data for deleting a person from Rekognition
 */
export interface DeletePersonJobData extends BasePersonSideEffectsJobData {}

/**
 * Data for deleting faces from Rekognition
 */
export interface DeleteFacesJobData extends BasePersonSideEffectsJobData {
  faceIds: string[];
}

/**
 * Result of deleting a person from Rekognition
 */
export interface DeletePersonResult {
  success: boolean;
}

/**
 * Result of deleting faces from Rekognition
 */
export interface DeleteFacesResult {
  success: boolean;
}

/**
 * Options for person side effects flow
 */
export interface PersonSideEffectsFlowOptions extends JobsOptions {
  attempts?: number;
  backoff?: {
    type: string;
    delay: number;
  };
  removeOnComplete?: boolean;
  removeOnFail?: boolean;
}

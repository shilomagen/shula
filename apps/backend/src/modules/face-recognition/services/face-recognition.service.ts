import {
  AssociatedFace,
  FaceDetail,
  FaceRecord,
} from '@aws-sdk/client-rekognition';
import { Injectable } from '@nestjs/common';
import { MetricsService } from '@shula/observability';
import { ImageMessageMedia } from '@shula/shared-queues';
import { ContextLogger } from 'nestjs-context-logger';
import sharp from 'sharp';
import {
  BoundingBox,
  RecognizedPerson,
} from '../interfaces/face-recognition.interfaces';
import { ImageUtilsService } from './image-utils.service';
import { RekognitionService } from './rekognition.service';

/**
 * Service for face recognition business logic
 */
@Injectable()
export class FaceRecognitionService {
  private readonly logger = new ContextLogger(FaceRecognitionService.name);
  private readonly CONFIDENCE_THRESHOLD = 70;

  constructor(
    private readonly rekognitionService: RekognitionService,
    private readonly imageUtilsService: ImageUtilsService,
    private readonly metricsService: MetricsService
  ) {}

  /**
   * Recognize faces in an image
   * @param groupId The group ID (used as collection ID)
   * @param imageData The image data (URL or base64) or ImageMessageMedia object
   * @returns Array of recognized persons
   */
  async recognizeFaces(
    groupId: string,
    imageData: string | ImageMessageMedia
  ): Promise<RecognizedPerson[]> {
    // Track recognition attempt
    this.metricsService.incrementCounter('face_recognition_attempts_total', 1, {
      groupId,
    });

    const startTime = Date.now();
    try {
      // Get image buffer from either URL, base64 string, or ImageMessageMedia
      const imageBuffer = await this.imageUtilsService.getImageBuffer(
        imageData
      );

      // Detect faces in the image
      this.logger.debug(`Detecting faces in image for group ${groupId}`);
      const detectedFaces = await this.rekognitionService.detectFaces(
        imageBuffer
      );

      if (detectedFaces.length === 0) {
        this.logger.log(`No faces detected in the image for group ${groupId}`);
        return [];
      }

      // Get image metadata for bounding box conversion
      const metadata = await sharp(imageBuffer).metadata();
      const imgWidth = metadata.width || 0;
      const imgHeight = metadata.height || 0;

      // Process each face and search for users
      const recognizedPersons: RecognizedPerson[] = [];
      const processedUsers = new Set<string>(); // Track unique users

      for (const face of detectedFaces) {
        try {
          if (!face.BoundingBox) {
            this.logger.warn('Face detected without bounding box, skipping');
            continue;
          }

          // Crop the face from the original image
          const croppedFace =
            await this.imageUtilsService.cropFaceFromAwsBoundingBox(
              imageBuffer,
              face.BoundingBox
            );

          // Convert AWS bounding box to standard format
          const standardBoundingBox =
            this.imageUtilsService.convertAwsBoundingBoxToStandard(
              face.BoundingBox,
              imgWidth,
              imgHeight
            );

          // Search for users with the cropped face
          const userMatches = await this.rekognitionService.searchUsersByImage(
            groupId,
            croppedFace,
            this.CONFIDENCE_THRESHOLD
          );

          // Add unique matches to results
          for (const match of userMatches) {
            if (
              match.User &&
              match.User.UserId &&
              !processedUsers.has(match.User.UserId)
            ) {
              processedUsers.add(match.User.UserId);
              recognizedPersons.push({
                personId: match.User.UserId,
                confidence: match.Similarity || 0,
                boundingBox: standardBoundingBox,
              });
            }
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
          this.logger.warn(
            `Error processing face: ${errorMessage}. Continuing with next face.`
          );
          // Continue with other faces even if one fails
        }
      }

      // Track successful recognition
      this.metricsService.incrementCounter(
        'face_recognition_success_total',
        1,
        {
          groupId,
        }
      );

      // Track number of faces recognized
      this.metricsService.recordHistogram(
        'recognized_faces_count',
        recognizedPersons.length,
        {
          groupId,
        }
      );

      this.logger.log(
        `Found ${recognizedPersons.length} persons in image for group ${groupId}`
      );
      return recognizedPersons;
    } catch (error) {
      // Track recognition failure
      this.metricsService.incrementCounter('face_recognition_error_total', 1, {
        groupId,
        errorType: error instanceof Error ? error.name : 'unknown',
      });

      this.logger.error(
        `Error recognizing faces: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
        { error }
      );
      throw error;
    } finally {
      // Track duration
      const duration = Date.now() - startTime;
      this.metricsService.recordHistogram(
        'face_recognition_duration_ms',
        duration,
        {
          groupId,
        }
      );
    }
  }

  /**
   * Detect faces in an image without recognition
   * @param imageData The image data (URL or base64) or ImageMessageMedia object
   * @returns Array of detected faces with bounding boxes
   */
  async detectFaces(imageData: string | ImageMessageMedia): Promise<
    {
      boundingBox: BoundingBox;
      faceDetail: FaceDetail;
      faceImage: Buffer;
    }[]
  > {
    try {
      // Get image buffer
      const imageBuffer = await this.imageUtilsService.getImageBuffer(
        imageData
      );

      // Detect faces
      const detectedFaces = await this.rekognitionService.detectFaces(
        imageBuffer
      );

      if (detectedFaces.length === 0) {
        this.logger.log('No faces detected in the image');
        return [];
      }

      // Get image metadata for bounding box conversion
      const metadata = await sharp(imageBuffer).metadata();
      const imgWidth = metadata.width || 0;
      const imgHeight = metadata.height || 0;

      // Process each face
      const result = [];
      for (const face of detectedFaces) {
        if (!face.BoundingBox) {
          this.logger.warn('Face detected without bounding box, skipping');
          continue;
        }

        // Crop the face
        const croppedFace =
          await this.imageUtilsService.cropFaceFromAwsBoundingBox(
            imageBuffer,
            face.BoundingBox
          );

        // Convert AWS bounding box to standard format
        const standardBoundingBox =
          this.imageUtilsService.convertAwsBoundingBoxToStandard(
            face.BoundingBox,
            imgWidth,
            imgHeight
          );

        result.push({
          boundingBox: standardBoundingBox,
          faceDetail: face,
          faceImage: croppedFace,
        });
      }

      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error detecting faces: ${errorMessage}`, { error });
      throw error;
    }
  }

  /**
   * Recognize a specific cropped face
   * @param groupId The group ID (used as collection ID)
   * @param faceImage The cropped face image buffer
   * @returns Array of recognized persons
   */
  async recognizeFace(
    groupId: string,
    faceImage: Buffer
  ): Promise<RecognizedPerson[]> {
    try {
      // Search for users with the cropped face
      const userMatches = await this.rekognitionService.searchUsersByImage(
        groupId,
        faceImage,
        this.CONFIDENCE_THRESHOLD
      );

      // Extract person IDs from the user matches
      return userMatches
        .map((match) => ({
          personId: match.User?.UserId || '',
          confidence: match.Similarity || 0,
        }))
        .filter((person) => person.personId);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error recognizing face: ${errorMessage}`, { error });
      throw error;
    }
  }

  /**
   * Delete a person from AWS Rekognition
   * @param collectionId The collection ID
   * @param personId The person ID to delete
   * @returns Object indicating if the person was deleted successfully
   */
  async deletePersonFromRekognition(
    collectionId: string,
    personId: string
  ): Promise<{
    success: boolean;
  }> {
    // Track user deletion attempt
    this.metricsService.incrementCounter('rekognition_user_deletion_total', 1, {
      collectionId,
    });

    try {
      await this.rekognitionService.deleteUser(collectionId, personId);
      this.logger.debug(
        `Successfully deleted user ${personId} from collection ${collectionId}`
      );
      return { success: true };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Error deleting user from Rekognition: ${errorMessage}`
      );
      throw error;
    }
  }

  /**
   * Delete faces from AWS Rekognition
   * @param collectionId The collection ID
   * @param faceIds The face IDs to delete
   * @returns Object indicating if the faces were deleted successfully
   */
  async deleteFacesFromRekognition(
    collectionId: string,
    faceIds: string[]
  ): Promise<{
    success: boolean;
  }> {
    // Track face deletion attempt
    this.metricsService.incrementCounter('rekognition_face_deletion_total', 1, {
      collectionId,
      faceCount: faceIds.length.toString(),
    });

    try {
      if (faceIds.length === 0) {
        return { success: true };
      }
      await this.rekognitionService.deleteFaces(collectionId, faceIds);
      this.logger.debug(
        `Successfully deleted faces ${faceIds.join(
          ','
        )} from collection ${collectionId}`
      );
      return { success: true };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Error deleting faces from Rekognition: ${errorMessage}`
      );
      throw error;
    }
  }

  /**
   * Index faces in an image
   * @param collectionId The collection ID
   * @param base64Data The base64 encoded image data
   * @param externalImageId Optional external image ID
   * @returns Array of indexed face records
   */
  async indexFaces(
    collectionId: string,
    base64Data: string,
    externalImageId?: string
  ): Promise<FaceRecord[]> {
    // Track indexing attempt
    this.metricsService.incrementCounter('face_indexing_attempts_total', 1, {
      collectionId,
      hasExternalId: externalImageId ? 'true' : 'false',
    });

    const startTime = Date.now();
    try {
      const imageBuffer = Buffer.from(base64Data, 'base64');
      const faceRecords = await this.rekognitionService.indexFaces(
        collectionId,
        imageBuffer,
        externalImageId
      );

      // Track successful indexing
      this.metricsService.incrementCounter('face_indexing_success_total', 1, {
        collectionId,
      });

      // Track number of faces indexed
      this.metricsService.recordHistogram(
        'indexed_faces_count',
        faceRecords.length,
        {
          collectionId,
        }
      );

      return faceRecords;
    } catch (error: unknown) {
      // Track indexing failure
      this.metricsService.incrementCounter('face_indexing_error_total', 1, {
        collectionId,
        errorType: error instanceof Error ? error.name : 'unknown',
      });

      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error indexing faces: ${errorMessage}`);
      throw error;
    } finally {
      // Track duration
      const duration = Date.now() - startTime;
      this.metricsService.recordHistogram(
        'face_indexing_duration_ms',
        duration,
        {
          collectionId,
        }
      );
    }
  }

  /**
   * Create a user and associate faces with them
   * @param collectionId The collection ID
   * @param userId The user ID to create
   * @param faceIds The face IDs to associate
   * @returns Object containing the user ID and associated faces
   */
  async createUserWithFaces(
    collectionId: string,
    userId: string,
    faceIds: string[]
  ): Promise<{
    userId: string;
    associatedFaces: AssociatedFace[];
  }> {
    // Track user creation
    this.metricsService.incrementCounter('rekognition_user_creation_total', 1, {
      collectionId,
      faceCount: faceIds.length.toString(),
    });

    try {
      return await this.rekognitionService.createUserWithFaces(
        collectionId,
        userId,
        faceIds
      );
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error creating user with faces: ${errorMessage}`);
      throw error;
    }
  }
}

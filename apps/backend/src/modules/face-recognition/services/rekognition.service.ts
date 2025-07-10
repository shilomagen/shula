import {
  AssociatedFace,
  AssociateFacesCommand,
  AssociateFacesCommandInput,
  AssociateFacesCommandOutput,
  BoundingBox,
  CreateCollectionCommand,
  CreateUserCommand,
  CreateUserCommandInput,
  CreateUserCommandOutput,
  DeleteFacesCommand,
  DeleteUserCommand,
  DetectFacesCommand,
  DetectFacesCommandInput,
  FaceDetail,
  FaceRecord,
  IndexFacesCommand,
  IndexFacesCommandInput,
  IndexFacesCommandOutput,
  ListCollectionsCommand,
  RekognitionClient,
  SearchUsersByImageCommand,
  SearchUsersByImageCommandInput,
  UserMatch,
} from '@aws-sdk/client-rekognition';
import { Inject, Injectable } from '@nestjs/common';
import { ContextLogger } from 'nestjs-context-logger';
import sharp from 'sharp';
import { REKOGNITION_CLIENT } from '../providers/rekognition-client.provider';

/**
 * Service for AWS Rekognition operations - pure AWS facade
 */
@Injectable()
export class RekognitionService {
  private readonly logger = new ContextLogger(RekognitionService.name);
  private readonly collectionPrefix: string = 'shula-';

  constructor(
    @Inject(REKOGNITION_CLIENT)
    private readonly rekognitionClient: RekognitionClient
  ) {}

  /**
   * Indexes up to 3 faces in a collection
   * @param collectionId - The ID of the collection to add the face to
   * @param imageBytes - The image bytes
   * @param externalImageId - External ID to associate with the face(s)
   * @param maxFaces - Maximum number of faces to index (1-3)
   * @returns Result of the indexing operation
   */
  public async indexFaces(
    collectionId: string,
    imageBytes: Buffer,
    externalImageId?: string,
    maxFaces = 3
  ): Promise<FaceRecord[]> {
    // Ensure collection exists
    await this.ensureCollectionExists(collectionId);

    // Prepare the command input
    const input: IndexFacesCommandInput = {
      CollectionId: this.getPrefixedCollectionId(collectionId),
      Image: {
        Bytes: imageBytes,
      },
      MaxFaces: Math.min(maxFaces, 3), // Limit to 3 faces as per requirement
      QualityFilter: 'AUTO', // Use AWS recommended quality filter
      DetectionAttributes: ['DEFAULT'], // Get default attributes
    };

    // Add external image ID if provided
    if (externalImageId) {
      input.ExternalImageId = externalImageId;
    }

    try {
      // Execute the command
      const command = new IndexFacesCommand(input);
      const response: IndexFacesCommandOutput =
        await this.rekognitionClient.send(command);

      this.logger.log(
        `Successfully indexed ${
          response.FaceRecords?.length || 0
        } faces in collection ${collectionId}`
      );

      // Return the face records
      return response.FaceRecords || [];
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error indexing faces: ${errorMessage}`, { error });
      throw error;
    }
  }

  /**
   * Creates a user in a collection
   * @param collectionId - The ID of the collection to create the user in
   * @param userId - The ID to assign to the user (personId)
   * @returns The created user ID
   */
  public async createUser(
    collectionId: string,
    userId: string
  ): Promise<string> {
    // Ensure collection exists
    await this.ensureCollectionExists(collectionId);

    const prefixedCollectionId = this.getPrefixedCollectionId(collectionId);

    // Prepare the command input
    const input: CreateUserCommandInput = {
      CollectionId: prefixedCollectionId,
      UserId: userId,
    };

    try {
      // Execute the command
      const command = new CreateUserCommand(input);
      const response: CreateUserCommandOutput =
        await this.rekognitionClient.send(command);

      this.logger.log(
        `Successfully created user ${userId} in collection ${collectionId}`
      );

      // Return the user ID (using the input ID if response doesn't include it)
      return (response as any).UserId || userId;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error creating user: ${errorMessage}`, { error });
      throw error;
    }
  }

  /**
   * Associates faces with a user in a collection
   * @param collectionId - The ID of the collection
   * @param userId - The ID of the user to associate faces with (personId)
   * @param faceIds - Array of face IDs to associate with the user
   * @returns Array of successfully associated face IDs
   */
  public async associateFaces(
    collectionId: string,
    userId: string,
    faceIds: string[]
  ): Promise<AssociatedFace[]> {
    const prefixedCollectionId = this.getPrefixedCollectionId(collectionId);

    // Prepare the command input
    const input: AssociateFacesCommandInput = {
      CollectionId: prefixedCollectionId,
      UserId: userId,
      FaceIds: faceIds,
    };

    try {
      // Execute the command
      const command = new AssociateFacesCommand(input);
      const response: AssociateFacesCommandOutput =
        await this.rekognitionClient.send(command);

      this.logger.log(
        `Successfully associated ${
          response.AssociatedFaces?.length || 0
        } faces with user ${userId} in collection ${collectionId}`
      );

      // Return the associated face IDs
      return response.AssociatedFaces || [];
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error associating faces: ${errorMessage}`, { error });
      throw error;
    }
  }

  /**
   * Creates a user and associates multiple faces with it in a single operation
   * @param collectionId - The ID of the collection
   * @param userId - The ID to assign to the user (personId)
   * @param faceIds - Array of face IDs to associate with the user
   * @returns Object containing the user ID and associated face IDs
   */
  public async createUserWithFaces(
    collectionId: string,
    userId: string,
    faceIds: string[]
  ): Promise<{ userId: string; associatedFaces: AssociatedFace[] }> {
    // Create the user
    const createdUserId = await this.createUser(collectionId, userId);

    // Associate faces with the user
    const associatedFaces = await this.associateFaces(
      collectionId,
      createdUserId,
      faceIds
    );

    return {
      userId: createdUserId,
      associatedFaces,
    };
  }

  /**
   * Detects faces in an image
   * @param imageBytes - The image bytes
   * @returns Array of detected face details
   */
  public async detectFaces(imageBytes: Buffer): Promise<FaceDetail[]> {
    const input: DetectFacesCommandInput = {
      Image: {
        Bytes: imageBytes,
      },
      Attributes: ['DEFAULT'],
    };

    try {
      const command = new DetectFacesCommand(input);
      const response = await this.rekognitionClient.send(command);

      this.logger.log(
        `Detected ${response.FaceDetails?.length || 0} faces in image`
      );
      return response.FaceDetails || [];
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error detecting faces: ${errorMessage}`, { error });
      throw error;
    }
  }

  /**
   * Clamps crop dimensions to fit within image bounds while preserving aspect ratio
   * @param dimensions - The original crop dimensions
   * @param imgWidth - The image width
   * @param imgHeight - The image height
   * @returns Adjusted crop dimensions that fit within the image bounds
   */
  private clampCropDimensions(
    dimensions: { left: number; top: number; width: number; height: number },
    imgWidth: number,
    imgHeight: number
  ): { left: number; top: number; width: number; height: number } {
    let { left, top, width, height } = dimensions;

    // Clamp left and width
    if (left < 0) {
      width += left; // Reduce width by the negative left amount
      left = 0;
    }
    if (left + width > imgWidth) {
      width = imgWidth - left;
    }

    // Clamp top and height
    if (top < 0) {
      height += top; // Reduce height by the negative top amount
      top = 0;
    }
    if (top + height > imgHeight) {
      height = imgHeight - top;
    }

    // Ensure minimum dimensions
    width = Math.max(width, 1);
    height = Math.max(height, 1);

    return { left, top, width, height };
  }

  /**
   * Crops a face from an image based on bounding box
   * @param imageBytes - The original image bytes
   * @param boundingBox - The bounding box of the face
   * @returns Buffer containing the cropped face image
   */
  public async cropFace(
    imageBytes: Buffer,
    boundingBox: BoundingBox
  ): Promise<Buffer> {
    try {
      if (
        boundingBox.Width === undefined ||
        boundingBox.Height === undefined ||
        boundingBox.Left === undefined ||
        boundingBox.Top === undefined
      ) {
        throw new Error('Invalid bounding box: missing required properties');
      }

      const image = sharp(imageBytes);
      const metadata = await image.metadata();
      const imgWidth = metadata.width || 0;
      const imgHeight = metadata.height || 0;

      if (imgWidth === 0 || imgHeight === 0) {
        throw new Error('Could not determine image dimensions');
      }

      const left = Math.floor(boundingBox.Left * imgWidth);
      const top = Math.floor(boundingBox.Top * imgHeight);
      const width = Math.floor(boundingBox.Width * imgWidth);
      const height = Math.floor(boundingBox.Height * imgHeight);

      const clampedDimensions = this.clampCropDimensions(
        { left, top, width, height },
        imgWidth,
        imgHeight
      );

      // Crop the image using clamped dimensions
      return image.extract(clampedDimensions).toBuffer();
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error cropping face: ${errorMessage}`, { error });
      throw error;
    }
  }

  /**
   * Searches for users by image
   * @param collectionId - The ID of the collection to search in
   * @param imageBytes - The image bytes (should be a cropped face)
   * @param threshold - Confidence threshold for matches (0-100)
   * @returns Array of user matches
   */
  public async searchUsersByImage(
    collectionId: string,
    imageBytes: Buffer,
    threshold: number
  ): Promise<UserMatch[]> {
    const prefixedCollectionId = this.getPrefixedCollectionId(collectionId);

    try {
      const input: SearchUsersByImageCommandInput = {
        CollectionId: prefixedCollectionId,
        Image: {
          Bytes: imageBytes,
        },
        UserMatchThreshold: threshold,
      };

      const command = new SearchUsersByImageCommand(input);
      const response = await this.rekognitionClient.send(command);
      const userMatches = response.UserMatches || [];

      this.logger.log(
        `Found ${userMatches.length} user matches in collection ${collectionId}`
      );
      return userMatches;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error searching users by image: ${errorMessage}`, {
        error,
      });
      throw error;
    }
  }

  /**
   * Ensures that a collection exists, creating it if necessary
   * @param collectionId - The ID of the collection
   * @returns True if the collection exists or was created
   */
  private async ensureCollectionExists(collectionId: string): Promise<boolean> {
    try {
      const prefixedCollectionId = this.getPrefixedCollectionId(collectionId);

      // Check if collection exists
      const listCommand = new ListCollectionsCommand({});
      const listResponse = await this.rekognitionClient.send(listCommand);

      const collectionExists =
        listResponse.CollectionIds?.includes(prefixedCollectionId) || false;

      if (!collectionExists) {
        // Create the collection if it doesn't exist
        const createCommand = new CreateCollectionCommand({
          CollectionId: prefixedCollectionId,
        });
        await this.rekognitionClient.send(createCommand);
        this.logger.log(`Created new collection: ${prefixedCollectionId}`);
      }

      return true;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error ensuring collection exists: ${errorMessage}`, {
        error,
      });
      throw error;
    }
  }

  /**
   * Gets the prefixed collection ID
   * @param collectionId - The base collection ID
   * @returns The prefixed collection ID
   */
  private getPrefixedCollectionId(collectionId: string): string {
    return `${this.collectionPrefix}${collectionId}`;
  }

  /**
   * Deletes a user from a collection
   * @param collectionId - The ID of the collection
   * @param userId - The ID of the user to delete
   * @returns True if the user was deleted successfully
   */
  public async deleteUser(
    collectionId: string,
    userId: string
  ): Promise<boolean> {
    const prefixedCollectionId = this.getPrefixedCollectionId(collectionId);
    const deleteUserCommand = new DeleteUserCommand({
      CollectionId: prefixedCollectionId,
      UserId: userId,
    });

    try {
      await this.rekognitionClient.send(deleteUserCommand);
      this.logger.log(
        `Deleted user ${userId} from collection ${prefixedCollectionId}`
      );
      return true;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error deleting user: ${errorMessage}`, { error });
      throw error;
    }
  }

  /**
   * Deletes faces from a collection
   * @param collectionId - The ID of the collection
   * @param faceIds - The IDs of the faces to delete
   * @returns True if the faces were deleted successfully
   */
  public async deleteFaces(
    collectionId: string,
    faceIds: string[]
  ): Promise<boolean> {
    const prefixedCollectionId = this.getPrefixedCollectionId(collectionId);
    const deleteFaceCommand = new DeleteFacesCommand({
      CollectionId: prefixedCollectionId,
      FaceIds: faceIds,
    });

    try {
      const response = await this.rekognitionClient.send(deleteFaceCommand);
      this.logger.log(
        `Deleted ${
          response.DeletedFaces?.length || 0
        } faces from collection ${prefixedCollectionId}`
      );
      return (response.DeletedFaces?.length || 0) > 0;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error deleting face: ${errorMessage}`, { error });
      throw error;
    }
  }
}

import { GetObjectCommand } from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';
import { ContextLogger } from 'nestjs-context-logger';
import { S3Service } from '../../../../../common/services/s3/s3.service';
import { PersonsService } from '../../../../persons/persons.service';
import { ActionType, BaseAction } from '../actions/actions';
import { ConnectPersonAction } from '../actions/connect-person';
import { ActionHandler, ActionResult } from './action-handler.interface';

@Injectable()
export class ConnectPersonActionHandler
  implements ActionHandler<ConnectPersonAction>
{
  private readonly logger = new ContextLogger(ConnectPersonActionHandler.name);

  constructor(
    private readonly personsService: PersonsService,
    private readonly s3Service: S3Service
  ) {}

  canHandle(action: BaseAction): boolean {
    return (action as any).action === ActionType.CONNECT_PERSON;
  }

  async execute(
    action: ConnectPersonAction,
    participantId: string
  ): Promise<ActionResult> {
    try {
      // 1. Create the person
      const createdPerson = await this.personsService.create({
        name: action.content.childName,
        participantId,
        groupId: action.content.groupId,
      });

      // 2. Download images from S3 and convert to base64
      const base64Images: string[] = [];
      for (const imageId of action.content.imageIds) {
        try {
          // Download image from S3
          const imageBuffer = await this.downloadImageFromS3(imageId);
          // Convert to base64
          const base64Image = imageBuffer.toString('base64');
          base64Images.push(base64Image);
        } catch (error: unknown) {
          this.logger.error(`Failed to download image ${imageId}:`, { error });
        }
      }

      if (base64Images.length === 0) {
        return {
          success: true,
          message:
            action.successMessage ||
            `Person ${action.content.childName} created successfully, but no face indexed.`,
          data: { personId: createdPerson.id },
        };
      }

      // 3. Index the person's face
      const indexResult = await this.personsService.indexPersonFace(
        createdPerson.id,
        action.content.groupId,
        base64Images,
        participantId
      );

      return {
        success: true,
        message:
          action.successMessage ||
          `Person ${action.content.childName} created successfully.`,
        data: {
          personId: createdPerson.id,
          faceIds: indexResult.faceIds,
          associatedFaces: indexResult.associatedFaces,
        },
      };
    } catch (error: unknown) {
      this.logger.error('Error in CreatePersonActionHandler:', { error });
      return {
        success: false,
        message:
          action.errorMessage ||
          `Failed to create person: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
        data: {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  private async downloadImageFromS3(imageId: string): Promise<Buffer> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.s3Service['config'].bucketName,
        Key: imageId,
      });

      const response = await this.s3Service['s3Client'].send(command);
      const chunks: Uint8Array[] = [];

      // @ts-expect-error - response.Body.transformToByteArray() exists but TypeScript doesn't know about it
      for await (const chunk of response.Body) {
        chunks.push(chunk);
      }

      return Buffer.concat(chunks);
    } catch (error: unknown) {
      this.logger.error(`Failed to download image from S3: ${imageId}`, {
        error,
      });
      throw error;
    }
  }
}

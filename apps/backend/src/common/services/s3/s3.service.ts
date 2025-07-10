import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ContextLogger } from 'nestjs-context-logger';
import { S3Config } from './interfaces/s3-config.interface';
import { S3UploadResult } from './interfaces/s3-upload-result.interface';
import { S3_CLIENT } from './s3.provider';

@Injectable()
export class S3Service {
  private readonly logger = new ContextLogger(S3Service.name);
  private readonly config: S3Config;

  constructor(
    @Inject(S3_CLIENT) private readonly s3Client: S3Client,
    private readonly configService: ConfigService
  ) {
    const bucketName = this.configService.get<string>(
      'WHATSAPP_MEDIA_BUCKET_NAME'
    );
    const region = this.configService.get<string>(
      'WHATSAPP_MEDIA_BUCKET_REGION'
    );
    const accessKey = this.configService.get<string>(
      'WHATSAPP_MEDIA_BUCKET_ACCESS_KEY'
    );
    const secretKey = this.configService.get<string>(
      'WHATSAPP_MEDIA_BUCKET_SECRET_KEY'
    );

    if (!bucketName || !region || !accessKey || !secretKey) {
      throw new Error('Missing required S3 configuration');
    }

    this.config = {
      bucketName,
      region,
      accessKey,
      secretKey,
    };
  }

  /**
   * Upload a file to S3 with metadata and TTL
   * @param file - The file buffer to upload
   * @param key - The S3 object key
   * @param metadata - Additional metadata to store with the object
   * @param ttlHours - Time to live in hours (default: 24)
   */
  async uploadFile(
    file: Buffer,
    key: string,
    metadata: Record<string, string>,
    ttlHours = 24
  ): Promise<S3UploadResult> {
    try {
      const contentType = metadata.contentType || 'application/octet-stream';
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + ttlHours);

      // Upload the file to S3
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.config.bucketName,
          Key: key,
          Body: file,
          ContentType: contentType,
          Metadata: {
            ...metadata,
            expiresAt: expiresAt.toISOString(),
          },
          Expires: expiresAt,
        })
      );

      // Generate a pre-signed URL that's valid for the TTL period
      const url = await this.generatePresignedUrl(key, ttlHours);

      return {
        key,
        url,
        expiresAt,
        contentType,
        size: file.length,
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to upload file to S3: ${msg}`, { error });
      throw error;
    }
  }

  /**
   * Generate a pre-signed URL for an S3 object
   * @param key - The S3 object key
   * @param expiresInHours - URL expiration time in hours
   */
  private async generatePresignedUrl(
    key: string,
    expiresInHours: number
  ): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.config.bucketName,
      Key: key,
    });

    return getSignedUrl(this.s3Client, command, {
      expiresIn: expiresInHours * 3600, // Convert hours to seconds
    });
  }

  /**
   * Delete an object from S3
   * @param key - The S3 object key
   */
  async deleteFile(key: string): Promise<void> {
    try {
      await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: this.config.bucketName,
          Key: key,
        })
      );
    } catch (error) {
      this.logger.error(
        `Failed to delete file from S3: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
        { error }
      );
      throw error;
    }
  }
}
